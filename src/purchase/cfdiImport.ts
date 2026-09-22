/**
 * @fileoverview Qué es cada archivo que se suelta en «Importar CFDI»: la clasificación del paso 1.
 * @module Contracts/Purchase/CfdiImport
 *
 * Decisión del 2026-09-22 («Capturar sin esperar al Buzón»): el usuario no elige entre importar,
 * adjuntar y conciliar. Suelta archivos, y **el sistema dice qué es cada uno** y cambia el verbo de
 * la fila: Convertir (nace una compra), Enlazar (ya la capturaste a mano: «Parece la compra OC-nnnn»)
 * o nada (ya capturado, complemento, cancelado, no es un CFDI…). Esta función es la única verdad de
 * esa clasificación; la nube y el escritorio la corren con los mismos hechos y dan lo mismo.
 *
 * Espejo en el escritorio: `Pittaj.Domain.Cfdi.CfdiImport` (mismos nombres, mismas baterías).
 */

/**
 * Los estados de un archivo, en el orden en que se comprueban. El primero que aplica gana.
 *
 * - `NO_ES_CFDI`: PDF, XML que no valida, acuse. Se lista para que sepas que lo vio, y se ignora.
 * - `SIN_UUID`: es un CFDI pero sin timbre. Sin UUID no hay identidad ni candado posible.
 * - `REPETIDO_EN_LOTE`: venía dos veces en el mismo ZIP.
 * - `EMITIDO_POR_TI`: el emisor es tu RFC. No es una compra; no se guarda.
 * - `YA_CAPTURADO`: mismo UUID y ya es una compra (conciliado o convertido). No se convierte dos veces.
 * - `COMPLEMENTO_DE_PAGO`: tipo P. Se guarda en el Buzón y cierra el «sin complemento» de su factura.
 * - `NOTA_DE_CREDITO`: tipo E. Se guarda; una nota de crédito de proveedor es una devolución.
 * - `CANCELADO_SAT`: el SAT lo tiene cancelado. Se guarda (es prueba) y no se convierte.
 * - `PARECE_LA_COMPRA`: UUID nuevo, pero hay UNA compra sin CFDI del mismo RFC, fecha a ±3 días y
 *   total dentro de la tolerancia. La fila dice «Enlazar», no «Convertir».
 * - `YA_ESTABA`: mismo UUID, sin capturar (llegó por el barrido). Se convierte igual.
 * - `EMISOR_69B`: el emisor está en la lista del 69-B. Se puede convertir; el aviso queda en el Buzón.
 * - `NUEVO`: entra al Buzón y se marca para convertir.
 */
export const CFDI_FILE_STATES = [
    'NO_ES_CFDI',
    'SIN_UUID',
    'REPETIDO_EN_LOTE',
    'EMITIDO_POR_TI',
    'YA_CAPTURADO',
    'COMPLEMENTO_DE_PAGO',
    'NOTA_DE_CREDITO',
    'CANCELADO_SAT',
    'PARECE_LA_COMPRA',
    'YA_ESTABA',
    'EMISOR_69B',
    'NUEVO',
] as const;

export type CfdiFileState = (typeof CFDI_FILE_STATES)[number];

/** Días de distancia entre la fecha del CFDI y la de la compra para que «parezca» la misma. */
export const CFDI_CANDIDATE_DAYS = 3;

/** Tolerancia de redondeo de fábrica (pesos). Setting del negocio: `purchases.cfdi-tolerance`. */
export const CFDI_TOLERANCE_DEFAULT = 1;

/** Una compra sin CFDI que podría ser la de este comprobante. */
export interface CfdiPurchaseCandidate {
    readonly purchaseId: string;
    readonly purchaseNumber: string;
    /** Lo que capturaste (total de la compra). */
    readonly total: number;
    /** Fecha de la compra (ISO 8601). */
    readonly date: string | null;
    /** Versión OCC, para enlazar sin volver a leer. */
    readonly version: number;
}

/** Los hechos que hacen falta para clasificar un archivo. Los reúne quien tiene la base de datos. */
export interface CfdiFileFacts {
    readonly esCfdi: boolean;
    readonly uuid: string | null;
    readonly repetidoEnLote: boolean;
    /** Emisor del comprobante y RFC del negocio, ya normalizados a mayúsculas. */
    readonly issuerRfc: string | null;
    readonly tenantRfc: string | null;
    /** I, E, P, N, T. */
    readonly tipoComprobante: string | null;
    readonly yaEnBuzon: boolean;
    /** Mismo UUID ya conciliado o convertido: `received_cfdi.status = VINCULADO` o compra con ese `invoice_uuid`. */
    readonly yaCapturado: boolean;
    /** `ValidacionEFOS`: "100" = SÍ está en el 69-B. */
    readonly issuerEfosStatus: string | null;
    /** Estado que devolvió el SAT la última vez: «Vigente», «Cancelado», o null si no se ha consultado. */
    readonly satEstado: string | null;
    readonly total: number;
    /** Compras sin CFDI del mismo RFC a ±3 días, con su total. Vacío si no se buscó. */
    readonly candidatas: readonly CfdiPurchaseCandidate[];
    readonly tolerance: number;
}

export interface CfdiFileVerdict {
    readonly estado: CfdiFileState;
    /** Se puede marcar para convertir en compra. */
    readonly convertible: boolean;
    /** Sale marcado de fábrica (los convertibles menos el 69-B, que avisa). */
    readonly marcado: boolean;
    /** La compra que parece ser (solo con `PARECE_LA_COMPRA`), con la diferencia CFDI − compra. */
    readonly candidata: (CfdiPurchaseCandidate & { readonly diferencia: number }) | null;
    /** Compras cercanas que NO cuadran, para la pista «¿es OC-nnnn? difiere $206.40». */
    readonly pistas: ReadonlyArray<CfdiPurchaseCandidate & { readonly diferencia: number }>;
    /** Por qué, en palabras del dueño. */
    readonly motivo: string;
}

const pesos = (n: number): string =>
    `$${Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const redondear = (n: number): number => Math.round(n * 100) / 100;

/** Clasifica un archivo con los hechos dados. Puro: mismo resultado en la nube y en el escritorio. */
export function clasificarArchivoCfdi(f: CfdiFileFacts): CfdiFileVerdict {
    const nada = { convertible: false, marcado: false, candidata: null, pistas: [] as CfdiFileVerdict['pistas'] };

    if (!f.esCfdi) return { estado: 'NO_ES_CFDI', ...nada, motivo: 'solo el XML trae lo que hace falta; este archivo no lo es' };
    if (!f.uuid) return { estado: 'SIN_UUID', ...nada, motivo: 'es un CFDI sin timbre: sin UUID no hay comprobante' };
    if (f.repetidoEnLote) return { estado: 'REPETIDO_EN_LOTE', ...nada, motivo: 'venía repetido en el mismo lote' };
    if (f.issuerRfc && f.tenantRfc && f.issuerRfc === f.tenantRfc)
        return { estado: 'EMITIDO_POR_TI', ...nada, motivo: 'lo emitiste tú: no es una compra' };
    if (f.yaCapturado) return { estado: 'YA_CAPTURADO', ...nada, motivo: 'ya es una compra: no se convierte dos veces' };

    const tipo = (f.tipoComprobante ?? 'I').toUpperCase();
    if (tipo === 'P') return { estado: 'COMPLEMENTO_DE_PAGO', ...nada, motivo: 'no es una compra: se guarda en el Buzón y cierra el «sin complemento» de su factura' };
    if (tipo === 'E') return { estado: 'NOTA_DE_CREDITO', ...nada, motivo: 'una nota de crédito del proveedor es una devolución: se captura desde la compra' };
    if (tipo !== 'I') return { estado: 'NO_ES_CFDI', ...nada, motivo: `un comprobante de tipo ${tipo} no es una compra` };

    if ((f.satEstado ?? '').toLowerCase().startsWith('cancel'))
        return { estado: 'CANCELADO_SAT', ...nada, motivo: 'cancelado en el SAT: se guarda como prueba y no se convierte' };

    // Candidatas: la que cuadra dentro de la tolerancia es «parece»; las demás son pista.
    const conDiferencia = f.candidatas.map((c) => ({ ...c, diferencia: redondear(f.total - c.total) }));
    const cuadran = conDiferencia.filter((c) => Math.abs(c.diferencia) <= f.tolerance);
    const pistas = conDiferencia.filter((c) => Math.abs(c.diferencia) > f.tolerance);

    if (cuadran.length === 1) {
        const c = cuadran[0]!;
        const exacta = c.diferencia === 0;
        return {
            estado: 'PARECE_LA_COMPRA',
            convertible: true,
            marcado: true,
            candidata: c,
            pistas,
            motivo: exacta
                ? `capturada a mano · mismo proveedor y total · se enlaza, no se crea otra`
                : `capturada a mano · mismo proveedor · difiere ${pesos(c.diferencia)} (redondeo) · se enlaza con ajuste`,
        };
    }

    const pistaTexto =
        cuadran.length > 1
            ? ` · podría ser ${cuadran.map((c) => c.purchaseNumber).join(' o ')}: elige al enlazar`
            : pistas.length > 0
              ? ` · ¿es ${pistas[0]!.purchaseNumber}? difiere ${pesos(pistas[0]!.diferencia)}`
              : '';

    if (f.yaEnBuzon)
        return { estado: 'YA_ESTABA', convertible: true, marcado: true, candidata: null, pistas: cuadran.length > 1 ? cuadran : pistas, motivo: `llegó por el barrido · sin capturar: se convierte igual${pistaTexto}` };
    if (f.issuerEfosStatus === '100')
        return { estado: 'EMISOR_69B', convertible: true, marcado: false, candidata: null, pistas: cuadran.length > 1 ? cuadran : pistas, motivo: `puedes convertirlo; queda en «Requieren tu atención» del Buzón${pistaTexto}` };

    return { estado: 'NUEVO', convertible: true, marcado: true, candidata: null, pistas: cuadran.length > 1 ? cuadran : pistas, motivo: `vigente en el SAT${pistaTexto}` };
}

/**
 * Las tres salidas al enlazar un CFDI con una compra capturada a mano, por la diferencia
 * CFDI − compra. Cuadrar es exacto; la tolerancia no lo decide, solo dice qué botón se ofrece.
 */
export type CfdiLinkOutcome = 'CUADRA' | 'DIFERENCIA_DE_REDONDEO' | 'NO_CUADRA';

export function evaluarDiferencia(diferencia: number, tolerance: number): CfdiLinkOutcome {
    const d = Math.abs(redondear(diferencia));
    if (d === 0) return 'CUADRA';
    if (d <= tolerance) return 'DIFERENCIA_DE_REDONDEO';
    return 'NO_CUADRA';
}
