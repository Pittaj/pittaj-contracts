/**
 * @fileoverview Zod schema para query params del listado de devoluciones.
 * @module Contracts/SalesReturn
 *
 * GET /api/sales-returns — lista paginada (orden por creación desc) con filtro opcional
 * de resolución (CASH/CREDIT_NOTE). Espejo (lectura) de la lista de Devoluciones del desktop.
 */

import { z } from 'zod';
import { RETURN_RESOLUTIONS } from '../primitives/salesReturnPrimitives';

/** Query params de GET /api/sales-returns. */
export const getSalesReturnsSchema = z.object({
    resolution: z.enum(RETURN_RESOLUTIONS).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetSalesReturnsQuery = z.infer<typeof getSalesReturnsSchema>;
