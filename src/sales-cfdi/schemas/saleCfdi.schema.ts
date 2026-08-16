/**
 * @fileoverview Vocabulario del CFDI emitido: la venta facturada, su REP y su cancelación.
 * @module Contracts/SalesCfdi/Schemas
 * @version 1.0.0
 *
 * ── Por qué este archivo nace tarde ──
 *
 * El flujo 2 —el tenant factura a su cliente— lleva meses funcionando **sin contrato**: el backend
 * validaba en el controlador cuando validaba, y la web se escribió sus propias `interface` a mano
 * en `features/tickets/api/saleCfdiApi.ts`. Dos definiciones de lo mismo que nadie compara.
 *
 * Lo que sigue **describe lo que hoy está desplegado**, no un rediseño. Donde una regla vivía
 * suelta en un handler, se sube aquí tal cual —no se cambia—; y donde no había validación
 * ninguna (el REP la aceptaba `Number(body.amount)` a pelo), se escribe la que el handler ya
 * daba por cierta.
 *
 * ⚠️ **`POST /api/sales-cfdi/:ticketId/stamp` lo consume también el escritorio**
 * (`SalesCfdiGateway.cs`). Su cuerpo se describe **exactamente** como está: cualquier campo nuevo
 * aquí tiene que ser opcional, o una versión vieja del escritorio deja de poder facturar.
 */

import { z } from 'zod';

/** Folio fiscal del SAT. En mayúsculas y con guiones, como lo timbra el PAC. */
const UUID_SAT = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

// ─────────────────────────────────────────────────────────────────────────────
// Vocabulario
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estado del comprobante de una venta.
 *
 * `PENDING` y `FAILED` **no existen ante el SAT**: son intentos. Por eso el libro fiscal
 * (`fiscalLedger.schema.ts`) no los devuelve, y por eso el panel del emisor los enseña en una
 * sección aparte y no mezclados con lo timbrado — un intento fallido que se cuenta como emitido
 * es una declaración de más.
 */
export const SALE_CFDI_STATUSES = ['PENDING', 'STAMPED', 'FAILED', 'CANCELLED'] as const;
export type SaleCfdiStatusValue = (typeof SALE_CFDI_STATUSES)[number];

/** Qué documento del TPV originó el comprobante. */
export const FISCAL_SOURCE_TYPES = ['SALE', 'RETURN', 'GLOBAL', 'PAYMENT'] as const;
export type FiscalSourceTypeValue = (typeof FISCAL_SOURCE_TYPES)[number];

/** RFC genérico del público en general (`c_RFC`). Lo lleva toda factura global. */
export const RFC_PUBLICO_EN_GENERAL = 'XAXX010101000';

/**
 * `c_MotivoCancelacion`. Son cuatro y **el 01 no es como los demás**: obliga a decir cuál es el
 * comprobante que sustituye al cancelado, y el SAT rechaza la cancelación si no viaja.
 */
export const CANCELLATION_MOTIVES = ['01', '02', '03', '04'] as const;
export type CancellationMotiveValue = (typeof CANCELLATION_MOTIVES)[number];

/** Etiquetas del catálogo, para no reescribirlas en cada pantalla. */
export const CANCELLATION_MOTIVE_LABELS: Record<CancellationMotiveValue, string> = {
    '01': 'Comprobante emitido con errores con relación',
    '02': 'Comprobante emitido con errores sin relación',
    '03': 'No se llevó a cabo la operación',
    '04': 'Operación nominativa relacionada en la factura global',
};

/** El que se usa cuando nadie elige: «con errores sin relación», que no pide sustituto. */
export const DEFAULT_CANCELLATION_MOTIVE: CancellationMotiveValue = '02';

/**
 * Formas de pago admitidas en un complemento de pago.
 *
 * 🔴 **Sin el `99` (Por definir).** El REP existe precisamente para decir *con qué* se pagó, así
 * que el SAT no lo admite ahí — aunque sí lo admita en la factura PPD que lo origina. Un `99`
 * aquí es un timbrado rechazado por el PAC, ya con el abono cobrado.
 *
 * ⚠️ **Son NUEVE y no las veintitantas del catálogo `c_FormaPago`**, y eso no es un recorte de este
 * archivo: es lo que `StampPaymentCfdiHandler` acepta hoy (`VALID_PAYMENT_FORMS`). Lo que no está
 * aquí lo rechaza el handler con *«la forma de pago del abono debe ser una clave real del SAT»* —
 * así que una pantalla que ofrezca más estaría ofreciendo botones que fallan.
 *
 * Son las que un negocio de mostrador usa de verdad; las de extinción de obligaciones —
 * compensación, novación, condonación— piden criterio contable y no se cobran en caja. Ampliarla
 * es decisión de producto **y** un cambio en el handler, en ese orden.
 */
export const REP_PAYMENT_FORMS = [
    '01', '02', '03', '04', '05', '06', '28', '29', '31',
] as const;
export type RepPaymentFormValue = (typeof REP_PAYMENT_FORMS)[number];

/** `c_Periodicidad` de la factura global. */
export const GLOBAL_PERIODICITIES = ['01', '02', '03', '04', '05'] as const;
export type GlobalPeriodicityValue = (typeof GLOBAL_PERIODICITIES)[number];

export const GLOBAL_PERIODICITY_LABELS: Record<GlobalPeriodicityValue, string> = {
    '01': 'Diario',
    '02': 'Semanal',
    '03': 'Quincenal',
    '04': 'Mensual',
    '05': 'Bimestral',
};

/**
 * El día del mes siguiente en que vence el REP.
 *
 * No es un detalle de pantalla: es lo que convierte «complementos pendientes» en una lista con
 * fecha, y el motivo por el que esa pantalla existe. Art. 29-A CFF y la Guía de llenado del REP.
 */
export const REP_DEADLINE_DAY = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Entradas · endpoints que YA existen
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Receptor capturado en el momento del timbrado.
 *
 * Opcional y **todo-o-nada**: si viene a medias, el backend lo ignora y factura al cliente de la
 * venta. Media captura no es una preferencia, es un dato incompleto — y timbrar con él manda al
 * SAT un receptor que nadie eligió.
 */
export const stampReceptorSchema = z.object({
    rfc: z.string().trim().min(12).max(13),
    nombre: z.string().trim().min(1).max(300),
    /** `DomicilioFiscalReceptor`: el CP del receptor, obligatorio en 4.0. */
    domicilioFiscalCP: z.string().trim().regex(/^\d{5}$/, 'El código postal son 5 dígitos'),
    /** `c_RegimenFiscal` del receptor. */
    regimenFiscal: z.string().trim().min(3).max(3),
    /** `c_UsoCFDI`. */
    usoCFDI: z.string().trim().min(2).max(4),
});

export type StampReceptorInput = z.infer<typeof stampReceptorSchema>;

/**
 * `POST /api/sales-cfdi/:ticketId/stamp`.
 *
 * El cuerpo entero es opcional: la web factura sin él y el backend usa el cliente de la venta.
 * **No endurecer esto** — lo manda el escritorio.
 */
export const stampSaleCfdiSchema = z.object({
    receptor: stampReceptorSchema.optional(),
});

export type StampSaleCfdiInput = z.infer<typeof stampSaleCfdiSchema>;

/**
 * `POST /api/sales-cfdi/:ticketId/cancel`.
 *
 * La regla del `01` se validaba dentro del handler y **sube aquí sin cambiarla**: así la pantalla
 * puede exigir el UUID sustituto *antes* de mandar, en vez de enterarse por un error del PAC con
 * el cliente delante.
 */
export const cancelSaleCfdiSchema = z
    .object({
        motive: z.enum(CANCELLATION_MOTIVES).default(DEFAULT_CANCELLATION_MOTIVE),
        /** Folio fiscal del comprobante que sustituye al cancelado. Solo con motivo `01`. */
        substitutionUuid: z.string().regex(UUID_SAT, 'El folio fiscal no tiene forma de UUID').nullish(),
    })
    .superRefine((v, ctx) => {
        if (v.motive === '01' && !v.substitutionUuid) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['substitutionUuid'],
                message: 'El motivo 01 exige el folio fiscal del comprobante que lo sustituye',
            });
        }
        if (v.motive !== '01' && v.substitutionUuid) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['substitutionUuid'],
                message: 'Solo el motivo 01 lleva comprobante que sustituya',
            });
        }
    });

export type CancelSaleCfdiInput = z.infer<typeof cancelSaleCfdiSchema>;

/**
 * `POST /api/sales-cfdi/:ticketId/rep` — complemento de pago de un abono.
 *
 * **La ruta no valida; el handler sí.** El controlador hace `Number(body.amount)` y
 * `String(body.paymentForm)` a pelo, así que un cuerpo vacío llega como `NaN` — pero
 * `StampPaymentCfdiHandler` lo para después con `invalid-amount` / `invalid-payment-form` y un
 * mensaje escrito para una persona.
 *
 * Lo que este esquema añade, entonces, no es la regla: es **dónde se entera quien la incumple**.
 * Validar en el borde convierte un viaje al servidor y un `blocked` en un campo en rojo antes de
 * mandar. Las reglas son las mismas del handler, a propósito.
 */
export const stampRepSchema = z.object({
    /** Lo abonado. En pesos, mayor que cero: un REP de $0 no existe. */
    amount: z.coerce.number().positive('El importe del abono debe ser mayor que cero'),
    paymentForm: z.enum(REP_PAYMENT_FORMS, {
        errorMap: () => ({ message: 'Forma de pago no admitida en un complemento (el 99 no lo acepta el SAT)' }),
    }),
    /** Cuándo se cobró. Si no viene, el backend usa el momento del timbrado. */
    paymentDate: z.string().datetime().optional(),
});

export type StampRepInput = z.infer<typeof stampRepSchema>;

/** `POST /api/sales-cfdi/:ticketId/rep/:repId/cancel`. */
export const cancelRepSchema = z.object({
    motive: z.enum(CANCELLATION_MOTIVES).default(DEFAULT_CANCELLATION_MOTIVE),
});

export type CancelRepInput = z.infer<typeof cancelRepSchema>;

/**
 * `POST /api/sales-cfdi/global/stamp` — la factura global del periodo.
 *
 * Idéntico al que hoy vive en `GlobalCfdiController`: se mueve, no se cambia.
 */
export const stampGlobalCfdiSchema = z.object({
    /** Inicio del rango (inclusive), ISO. */
    from: z.string().datetime(),
    /** Fin del rango (exclusive), ISO. */
    to: z.string().datetime(),
    periodicidad: z.enum(GLOBAL_PERIODICITIES),
    /** `c_Meses`: 01–12 mensual · 13–18 bimestral. */
    meses: z.string().regex(/^(0[1-9]|1[0-8])$/, 'Mes fuera del catálogo c_Meses'),
    anio: z.number().int().min(2020).max(2100),
});

export type StampGlobalCfdiInput = z.infer<typeof stampGlobalCfdiSchema>;

/** Parámetro `:ticketId` de las rutas del comprobante. */
export const saleCfdiTicketParamSchema = z.object({
    ticketId: z.string().uuid(),
});

export type SaleCfdiTicketParam = z.infer<typeof saleCfdiTicketParamSchema>;
