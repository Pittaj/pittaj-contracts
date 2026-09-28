/**
 * @fileoverview Zod schemas del concepto de gasto: crear, editar, listar, sincronizar.
 *
 * Un concepto de gasto es **lo que se consumió** (luz, renta, internet) y decide a qué
 * cuenta de resultados va el renglón de un gasto. Lo elige quien captura; la cuenta la
 * pone la semilla y la cambia el contador.
 *
 * - **Guarda un código de cuenta, no un id.** El libro es por empresa: la `601-03` de la
 *   empresa A no es la fila de la empresa B. El código se resuelve contra el libro de la
 *   empresa del documento al contabilizar, igual que los huecos del motor.
 * - **Es del tenant**, como las líneas de negocio: «Luz» significa lo mismo en dos RFC.
 * - **La línea por omisión es opcional**: vacía, el gasto toma la del proveedor o la de
 *   la sucursal (plan, F6.2).
 *
 * Plan: docs `producto/plan-empresas-y-lineas-de-negocio.md` (F6.1). Contrato de las dos
 * plataformas; id generado en origen.
 *
 * @module Contracts/ExpenseConcept
 */

import { z } from 'zod';
import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync/index.js';
import { businessLineRefSchema } from '../../business-line/schemas/createBusinessLine.schema.js';

/** Estados del concepto. */
export const EXPENSE_CONCEPT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type ExpenseConceptStatus = (typeof EXPENSE_CONCEPT_STATUSES)[number];

/**
 * Código de cuenta: grupo SAT de tres dígitos, guion, dos dígitos (`601-03`), con niveles
 * opcionales (`601-03-01`). Es el formato del catálogo de Pittaj.
 */
export const LEDGER_ACCOUNT_CODE_REGEX = /^\d{3}(-\d{2,3}){1,3}$/;

/**
 * Solo cuentas de gasto: `6xx` (gastos de operación) y `7xx` (financieros). Una compra de
 * gasto que cargara a una cuenta de balance —inventario, activo, bancos— dejaría de ser
 * gasto sin que nadie lo notara.
 */
export function esCuentaDeGasto(code: string): boolean {
    return LEDGER_ACCOUNT_CODE_REGEX.test(code) && (code.startsWith('6') || code.startsWith('7'));
}

const ERROR_MESSAGES = {
    ID_INVALID_UUID: 'El ID debe ser un UUID válido',
    NAME_REQUIRED: 'El nombre del concepto es requerido',
    NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
    NAME_TOO_LONG: 'El nombre no puede exceder 80 caracteres',
    ACCOUNT_REQUIRED: 'La cuenta contable es requerida',
    ACCOUNT_FORMAT: 'La cuenta debe tener el formato 601-03',
    ACCOUNT_NOT_EXPENSE: 'Solo cuentas de gastos (601 a 799)',
} as const;

const ledgerAccountCodeSchema = z
    .string({ required_error: ERROR_MESSAGES.ACCOUNT_REQUIRED })
    .trim()
    .regex(LEDGER_ACCOUNT_CODE_REGEX, { message: ERROR_MESSAGES.ACCOUNT_FORMAT })
    .refine(esCuentaDeGasto, { message: ERROR_MESSAGES.ACCOUNT_NOT_EXPENSE });

const baseExpenseConceptFields = {
    name: z
        .string({ required_error: ERROR_MESSAGES.NAME_REQUIRED })
        .trim()
        .min(2, { message: ERROR_MESSAGES.NAME_TOO_SHORT })
        .max(80, { message: ERROR_MESSAGES.NAME_TOO_LONG }),
    ledgerAccountCode: ledgerAccountCodeSchema,
    /** Línea de negocio por omisión; `null` = la del proveedor o la de la sucursal. */
    businessLineId: businessLineRefSchema,
    /** Se ofrece en la caja al registrar un gasto de caja (F6.7). */
    offeredAtCash: z.boolean().optional().default(false),
};

/** Crear un concepto: id generado en origen. */
export const createExpenseConceptSchema = z
    .object({
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        ...baseExpenseConceptFields,
    })
    .strict();
export type CreateExpenseConceptRequest = z.infer<typeof createExpenseConceptSchema>;

/** Editar un concepto: concurrencia optimista por `version`. */
export const updateExpenseConceptSchema = z
    .object({
        ...baseExpenseConceptFields,
        version: z.number().int().min(1),
    })
    .strict();
export type UpdateExpenseConceptRequest = z.infer<typeof updateExpenseConceptSchema>;

export const expenseConceptIdParamSchema = z.object({
    id: z.string().uuid({ message: 'El ID del concepto de gasto debe ser un UUID válido' }),
});
export type ExpenseConceptIdParam = z.infer<typeof expenseConceptIdParamSchema>;

export const getExpenseConceptsSchema = z.object({
    status: z.enum(EXPENSE_CONCEPT_STATUSES).optional(),
    search: z.string().trim().max(80).optional(),
});
export type GetExpenseConceptsQuery = z.infer<typeof getExpenseConceptsSchema>;

/**
 * Referencia a un concepto en un renglón. Acepta `''` como «sin concepto» porque así lo
 * manda un `<select>` vacío, igual que la línea de negocio.
 */
export const expenseConceptRefSchema = z
    .preprocess(
        (val) => (val === '' ? null : val),
        z.union([z.string().uuid('El concepto de gasto debe ser un UUID válido'), z.null()]),
    )
    .optional();

export const syncPushExpenseConceptSchema = syncPushRequestSchema;
export const syncPullExpenseConceptSchema = syncPullRequestSchema;
