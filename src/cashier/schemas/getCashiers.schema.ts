/**
 * @fileoverview Zod schema para query params del listado de cajeros.
 * @module Contracts/Cashier
 *
 * GET /api/cashiers — lista paginada (orden por nombre asc) con filtro opcional
 * de estado (ACTIVE/INACTIVE). Espejo (lectura) de la lista de Cajeros del desktop
 * (CashierListPage).
 */

import { z } from 'zod';

/** Estados del cajero (espejo de CashierStatus). */
export const CASHIER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

/** Query params de GET /api/cashiers. */
export const getCashiersSchema = z.object({
    status: z.enum(CASHIER_STATUSES).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetCashiersQuery = z.infer<typeof getCashiersSchema>;
