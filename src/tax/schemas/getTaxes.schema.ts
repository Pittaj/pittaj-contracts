/**
 * @fileoverview Zod schema para query params del listado de impuestos.
 * @module Contracts/Tax
 */

import { z } from 'zod';
import { TAX_STATUSES } from './createTax.schema';

/**
 * Query params de GET /taxes.
 * El catálogo es pequeño (como en desktop): sin paginación,
 * solo filtro por status y búsqueda por nombre.
 */
export const getTaxesSchema = z.object({
    status: z.enum(TAX_STATUSES).optional(),
    search: z.string().trim().max(50).optional(),
});

export type GetTaxesQuery = z.infer<typeof getTaxesSchema>;
