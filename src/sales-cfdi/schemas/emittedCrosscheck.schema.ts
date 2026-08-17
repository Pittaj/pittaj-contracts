/**
 * @fileoverview El cruce de lo emitido contra lo que el SAT tiene · fase 2 de la conciliación.
 * @module Contracts/SalesCfdi/Schemas
 * @version 1.0.0
 *
 * ── La pregunta, y en qué se distingue de la fase 1 ──
 *
 * La **fase 1** pregunta por cada comprobante nuestro: *«¿sigue vigente?»*. Solo ve lo que ya
 * conocemos, así que jamás puede descubrir una factura que Pittaj no timbró.
 *
 * La **fase 2** pregunta al revés: *«¿qué tiene el SAT a mi nombre que yo no tenga?»*. Es la única
 * de las dos que puede encontrar **una factura emitida por fuera del producto** —desde el portal
 * del PAC, desde otro sistema, por el contador—, que es un ingreso declarado que no está en la
 * contabilidad del negocio ni en su inventario.
 *
 * ── 🔴 Esto necesita la e.firma, y por eso lo baja el ESCRITORIO ──
 *
 * A diferencia de la fase 1 —servicio público de verificación, sin credencial—, la descarga masiva
 * exige la e.firma. La e.firma vive en la máquina del cliente y **no sale de ahí**; lo que viaja a
 * la nube es el resultado: filas de metadata (UUID, RFC, total, fecha, estado). La credencial no
 * se toca, no se copia y no se sincroniza.
 *
 * ── Lo que llega NO es un comprobante que se dé de alta ──
 *
 * 🔴 Nada de lo que sube por aquí entra al buzón ni crea una venta. El buzón es de **lo que nos
 * facturaron**; meter ahí un comprobante propio invita a capturarlo como compra, que es la forma
 * exacta de BUG-028: dos caminos registrando el mismo hecho, las dos pólizas cuadrando y el IVA
 * doble. Y dar de alta la venta sola metería inventario que nunca se movió.
 *
 * **Lo que baja se usa para comparar y para avisarle a una persona.** Punto.
 */

import { z } from 'zod';

/**
 * Qué encontró el cruce. **«Coincide» no está en la lista, y es deliberado.**
 *
 * Que un UUID esté en los dos lados con el mismo importe no es un hecho que guardar: es la
 * ausencia de uno. Guardarlo llenaría la tabla con miles de filas al mes que nadie va a leer y
 * volvería lento justamente lo único que importa — las tres que sí lo son.
 */
export const CROSSCHECK_FINDING_KINDS = [
    /**
     * El SAT tiene un comprobante a nuestro nombre que Pittaj no tiene.
     *
     * 🔴 **Es el hallazgo que justifica la fase entera.** Alguien facturó por fuera: ese ingreso
     * está declarado ante el SAT y no está en la contabilidad del negocio.
     */
    'SOLO_EN_SAT',
    /**
     * Pittaj cree tener un timbrado que el SAT no reconoce en ese periodo.
     *
     * Casi siempre es un timbrado a medias —se guardó el UUID y el envío no llegó a cerrar—, y en
     * ese caso el negocio cree haber facturado algo que ante el SAT no existe.
     */
    'SOLO_EN_PITTAJ',
    /**
     * Mismo UUID en los dos lados, distinto total o distinto receptor.
     *
     * Significa que nuestro snapshot fiscal se desvió del comprobante real. **Manda el SAT**: lo
     * que él tiene es lo que está declarado.
     */
    'DIFERENCIAS',
] as const;
export type CrosscheckFindingKindValue = (typeof CROSSCHECK_FINDING_KINDS)[number];

/**
 * 🔴 **La cancelación NO se reporta aquí, aunque la metadata la traiga.**
 *
 * La metadata del SAT incluye el estado del comprobante, así que sería trivial emitir un hallazgo
 * «el SAT dice cancelado y nosotros vigente». **No se hace**: eso es exactamente lo que vigila la
 * fase 1, cada noche y sobre el histórico entero, no solo sobre los meses que alguien cruce.
 *
 * Reportarlo en los dos sitios daría dos avisos del mismo hecho que se apagan por separado — uno
 * marcado como revisado aquí y todavía encendido allá—, y a la tercera vez nadie mira ninguno.
 * `DIFERENCIAS` compara **total y receptor**, y nada más.
 */
export const CROSSCHECK_NO_REPORTA_CANCELACIONES = true;

/**
 * Un renglón tal como lo entrega el SAT en la metadata.
 *
 * Es **el otro lado del cruce**, no un comprobante nuestro: se valida con la manga ancha
 * suficiente para no perder una fila por un campo que el SAT decida añadir o dejar vacío. Si esta
 * validación se pone estricta, un cambio en el servicio del SAT deja de traer datos y el cruce
 * sale «limpio» — que es el fallo que peor se detecta: no hay error, no hay hallazgos, todo
 * parece bien.
 */
export const satMetadataRowSchema = z.object({
    /** Folio fiscal. Se normaliza a mayúsculas al cruzar: el SAT no es consistente. */
    uuid: z.string().uuid(),
    /** RFC del receptor. El SAT lo manda vacío en algunos globales antiguos. */
    rfcReceptor: z.string().trim().max(13).nullable().default(null),
    /** Nombre del receptor tal como viene. Solo para que la pantalla no enseñe un RFC pelado. */
    nombreReceptor: z.string().trim().max(300).nullable().default(null),
    /**
     * MontoTotal, **en pesos con dos decimales** tal como lo publica el SAT.
     *
     * ⚠️ Llega como número y se compara **en centavos enteros**: comparar `1234.56 !== 1234.56`
     * en flotantes produce diferencias fantasma que no se pueden explicar a nadie.
     */
    total: z.number(),
    /** Fecha de emisión que declara el SAT (ISO). Es la que decide a qué mes pertenece. */
    fechaEmision: z.string().datetime(),
    /** `Vigente` / `Cancelado`. Viaja para poder enseñarlo, **no** para generar hallazgos. */
    estado: z.string().trim().max(40).nullable().default(null),
    /** `I` ingreso, `E` egreso, `P` pago… Texto del SAT, sin enum nuestro. */
    tipoComprobante: z.string().trim().max(10).nullable().default(null),
});
export type SatMetadataRow = z.infer<typeof satMetadataRowSchema>;

/** Cuántas filas caben en un envío. Un mes grande no entra de una y el Worker tiene tope. */
export const MAX_FILAS_POR_LOTE = 1000;

/**
 * `POST /api/sales-cfdi/sat-crosscheck/metadata` — el escritorio sube un trozo del mes.
 *
 * ── 🔴 Por qué hay `uploadId`, `chunkIndex` y `chunkCount`, y no solo filas ──
 *
 * Porque **un mes a medias miente en la dirección más cara**. Si el escritorio manda la mitad de
 * junio y la nube cruza con lo que le llegó, todo lo que faltaba aparece como `SOLO_EN_PITTAJ`:
 * decenas de avisos de «el SAT no reconoce esto» que son falsos, sobre comprobantes perfectamente
 * timbrados. Después de la primera tanda así, nadie vuelve a mirar la pantalla.
 *
 * Por eso **el cruce no corre hasta que han llegado los `chunkCount` lotes del mismo `uploadId`**.
 * Y el `uploadId` es nuevo en cada intento a propósito: si una subida se corta a la mitad y se
 * reintenta, los lotes viejos no se mezclan con los nuevos — se descartan por no ser del envío en
 * curso. Un `uploadId` estable ahorraría tráfico y traería justo el bug que esto evita.
 */
export const pushSatEmittedMetadataSchema = z.object({
    /** GUID nuevo por cada intento de subida completo. No reutilizar entre reintentos. */
    uploadId: z.string().uuid(),
    /** Ejercicio del periodo cruzado. */
    year: z.coerce.number().int().min(2020).max(2100),
    /**
     * Mes **cerrado** que se cruza.
     *
     * Se cruza por mes y no por rango libre porque el mes es la unidad en la que se declara, y
     * porque un rango a caballo entre dos meses produce `SOLO_EN_PITTAJ` en los bordes por pura
     * aritmética de fechas.
     */
    month: z.coerce.number().int().min(1).max(12),
    /** Qué equipo lo bajó. Sirve para saber a quién reclamarle si un mes nunca se cruza. */
    deviceId: z.string().uuid().optional(),
    /** 0-based. */
    chunkIndex: z.coerce.number().int().min(0),
    /** Cuántos lotes componen este envío. El cruce corre al llegar el último que faltaba. */
    chunkCount: z.coerce.number().int().min(1),
    rows: z.array(satMetadataRowSchema).max(MAX_FILAS_POR_LOTE),
}).refine((v) => v.chunkIndex < v.chunkCount, {
    message: 'chunkIndex tiene que ser menor que chunkCount',
    path: ['chunkIndex'],
});
export type PushSatEmittedMetadataInput = z.infer<typeof pushSatEmittedMetadataSchema>;

/**
 * `GET /api/sales-cfdi/sat-crosscheck` — los hallazgos, que es lo único que se guarda.
 *
 * `includeReviewed` va en **false** por omisión: la lista es una bandeja de trabajo, no un
 * archivo. Lo ya revisado se puede pedir, pero no estorba lo pendiente.
 */
export const listCrosscheckFindingsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    kind: z.enum(CROSSCHECK_FINDING_KINDS).optional(),
    includeReviewed: z.coerce.boolean().default(false),
});
export type ListCrosscheckFindingsInput = z.infer<typeof listCrosscheckFindingsSchema>;

/** `GET /api/sales-cfdi/sat-crosscheck/periods` — qué meses se han cruzado y cómo salieron. */
export const listCrosscheckPeriodsSchema = z.object({
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    limit: z.coerce.number().int().positive().max(36).default(12),
});
export type ListCrosscheckPeriodsInput = z.infer<typeof listCrosscheckPeriodsSchema>;

/** Hasta dónde llega una nota de revisión. Corta, porque no es el sitio donde se investiga. */
export const MAX_LARGO_NOTA_REVISION = 500;

/**
 * `PATCH /api/sales-cfdi/sat-crosscheck/:id/reviewed` — «ya lo miré».
 *
 * ── Por qué existe esta marca y no un botón que lo arregle ──
 *
 * Un hallazgo `SOLO_EN_SAT` **no tiene arreglo automático que sea correcto**: dar de alta la venta
 * movería inventario que nunca se movió, e importarla como compra es BUG-028. La única salida
 * honesta es que una persona lo resuelva fuera y deje dicho que ya está.
 *
 * 🔴 **Y la marca es lo que hace que el cruce se pueda repetir.** Sin ella, volver a cruzar junio
 * el mes que viene reaparece los mismos cinco hallazgos como si fueran nuevos; con ella, el
 * recruce **conserva la revisión** de los que siguen ahí y solo destaca lo que no estaba antes.
 *
 * `reviewed: false` la quita: alguien se puede equivocar al marcar, y una marca que no se puede
 * deshacer se acaba usando para vaciar la bandeja.
 */
export const markCrosscheckFindingReviewedSchema = z.object({
    reviewed: z.boolean().default(true),
    /** Qué se hizo con él. Lo lee la siguiente persona, o el mismo dentro de tres meses. */
    note: z.string().trim().max(MAX_LARGO_NOTA_REVISION).optional(),
});
export type MarkCrosscheckFindingReviewedInput = z.infer<typeof markCrosscheckFindingReviewedSchema>;

/**
 * Compara dos importes del cruce. **En centavos y exacto.**
 *
 * Sin tolerancia a propósito: cualquier margen que se ponga aquí esconde justo la clase de
 * diferencia que interesa —un comprobante timbrado por otro importe— y no ahorra nada, porque los
 * dos lados salen de un XML que lleva el monto con dos decimales.
 */
export function mismoImporte(a: number | null, b: number | null): boolean {
    if (a === null || b === null) return false;
    return Math.round(a * 100) === Math.round(b * 100);
}

/** Normaliza un folio fiscal para cruzarlo: el SAT no es consistente con las mayúsculas. */
export function normalizarUuid(uuid: string): string {
    return uuid.trim().toUpperCase();
}
