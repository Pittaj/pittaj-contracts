/**
 * @fileoverview Zod schema para «quién me debe».
 * @module Contracts/CustomerPayment
 *
 * GET /api/customer-payments/debtors — la antigüedad de saldos agrupada por cliente.
 *
 * Mismos filtros que `receivables` porque es la misma verdad vista de otra forma: si los dos
 * endpoints aceptaran cortes distintos, el total de uno no cuadraría con el del otro y alguien
 * perdería una tarde averiguando por qué.
 */

import { z } from 'zod';

/** Query params de GET /api/customer-payments/debtors. */
export const getDebtorsSchema = z.object({
    locationId: z.string().max(36).optional(),
    /** Fecha de corte (`YYYY-MM-DD`). Si no viene, hoy. */
    asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    /** Solo los que se pasaron de su límite de crédito. */
    onlyOverLimit: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetDebtorsQuery = z.infer<typeof getDebtorsSchema>;
