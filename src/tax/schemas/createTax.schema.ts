/**
 * @fileoverview Zod schema para crear un impuesto.
 *
 * Réplica del dominio desktop (Pittaj.Domain/Tax):
 * - rate es FRACCIÓN 0-1 (0.16 = 16%), la UI captura % y convierte
 * - invariante: ZERO/EXEMPT/NOT_OBJECT exigen rate 0; IVA exige rate en (0, 1]; IEPS por tasa,
 *   (0, 3] (D7b: tabaco 160 % = 1.6); IEPS por cuota, > 0 (pesos por unidad)
 *
 * @module Contracts/Tax
 */

import { z } from 'zod';

/** Tipos de impuesto (enum del dominio desktop TaxKind). */
/** D7a · `NOT_OBJECT` = no objeto de impuesto (`ObjetoImp 01`): el CFDI no lleva nodo de impuestos. */
export const TAX_KINDS = ['IVA', 'IEPS', 'ZERO', 'EXEMPT', 'NOT_OBJECT'] as const;
export type TaxKind = (typeof TAX_KINDS)[number];

/** Estados del impuesto (VO TaxStatus). */
export const TAX_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type TaxStatus = (typeof TAX_STATUSES)[number];

const ERROR_MESSAGES = {
    ID_INVALID_UUID: 'El ID debe ser un UUID válido',
    NAME_REQUIRED: 'El nombre del impuesto es requerido',
    NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
    NAME_TOO_LONG: 'El nombre no puede exceder 50 caracteres',
    RATE_RANGE: 'La tasa debe ser una fracción entre 0 y 1 (0.16 = 16%)',
    KIND_INVALID: 'Tipo inválido. Use: IVA, IEPS, ZERO, EXEMPT o NOT_OBJECT',
    SAT_FACTOR_TOO_LONG: 'El factor SAT no puede exceder 20 caracteres',
    SAT_CODE_TOO_LONG: 'El código SAT no puede exceder 10 caracteres',
    ZERO_EXEMPT_RATE: 'Tasa 0, Exento y No objeto deben tener tasa 0',
    IVA_IEPS_RATE: 'El IVA requiere una tasa mayor a 0 y hasta 1; el IEPS por tasa, mayor a 0 y hasta 3 (300 %)',
    CUOTA_RATE: 'Un IEPS por cuota requiere una cuota mayor a 0 (pesos por unidad)',
} as const;

/** D7b · ¿Es un IEPS por cuota (pesos por unidad, no fracción)? */
export function esCuota(data: { kind: string; satFactor?: string | null }): boolean {
    return data.kind === 'IEPS' && (data.satFactor ?? '').trim().toLowerCase() === 'cuota';
}

/** Invariante del dominio Tax.Validate(rate, kind). */
function validateRateKind(
    data: { rate: number; kind: TaxKind; satFactor?: string | null },
    ctx: z.RefinementCtx
): void {
    if ((data.kind === 'ZERO' || data.kind === 'EXEMPT' || data.kind === 'NOT_OBJECT') && data.rate !== 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rate'], message: ERROR_MESSAGES.ZERO_EXEMPT_RATE });
    }
    if (data.kind === 'IVA' && (data.rate <= 0 || data.rate > 1)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rate'], message: ERROR_MESSAGES.IVA_IEPS_RATE });
    }
    // D7b: el IEPS por tasa puede pasar del 100 % (tabaco 160 % = 1.6) hasta 3 —un 8 capturado en
    // lugar de 0.08 se sigue rechazando—; por cuota son pesos por unidad, sin tope.
    if (data.kind === 'IEPS' && (data.rate <= 0 || (!esCuota(data) && data.rate > 3))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rate'], message: esCuota(data) ? ERROR_MESSAGES.CUOTA_RATE : ERROR_MESSAGES.IVA_IEPS_RATE });
    }
}

const baseTaxFields = {
    /** Nombre del impuesto (único por tenant, case-insensitive). */
    name: z
        .string({ required_error: ERROR_MESSAGES.NAME_REQUIRED })
        .trim()
        .min(2, { message: ERROR_MESSAGES.NAME_TOO_SHORT })
        .max(50, { message: ERROR_MESSAGES.NAME_TOO_LONG }),

    /**
     * Tasa como fracción 0-1 (0.16 = 16%), NO porcentaje. D7b: en un IEPS por cuota es la cuota en
     * pesos por unidad y puede pasar de 1.
     */
    rate: z
        .number()
        .min(0, { message: ERROR_MESSAGES.RATE_RANGE })
        .max(100_000, { message: ERROR_MESSAGES.RATE_RANGE }),

    /** Tipo de impuesto. */
    kind: z.enum(TAX_KINDS, { errorMap: () => ({ message: ERROR_MESSAGES.KIND_INVALID }) }),

    /** Si el impuesto va incluido en el precio del producto. */
    isIncluded: z.boolean(),

    /** Factor SAT: "Tasa" / "Cuota" / "Exento" (opcional). */
    satFactor: z.string().trim().max(20, { message: ERROR_MESSAGES.SAT_FACTOR_TOO_LONG }).nullish(),

    /** Código SAT del impuesto: "002" IVA, "003" IEPS (opcional). */
    satCode: z.string().trim().max(10, { message: ERROR_MESSAGES.SAT_CODE_TOO_LONG }).nullish(),
};

/**
 * Schema para crear un impuesto.
 * El id lo genera el cliente (offline-first, crypto.randomUUID()).
 */
export const createTaxSchema = z
    .object({
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        ...baseTaxFields,
        /** Marcar como impuesto predeterminado (desmarca los demás). */
        isDefault: z.boolean().optional().default(false),
    })
    .strict()
    .superRefine(validateRateKind);

export type CreateTaxRequest = z.infer<typeof createTaxSchema>;

/**
 * Schema para actualizar un impuesto.
 * Como en desktop, Update NO cambia isDefault ni status
 * (para eso están /default, /activate y /deactivate).
 */
export const updateTaxSchema = z
    .object({
        ...baseTaxFields,
        /** Versión actual para optimistic locking. */
        version: z.number().int().min(1),
    })
    .strict()
    .superRefine(validateRateKind);

export type UpdateTaxRequest = z.infer<typeof updateTaxSchema>;
