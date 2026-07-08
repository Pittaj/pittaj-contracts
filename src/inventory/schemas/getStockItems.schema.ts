/**
 * @fileoverview Zod schema para query params del listado de existencias.
 * @module Contracts/Inventory
 *
 * GET /api/stock-items — lista paginada con filtros opcionales de producto y
 * bodega. Espejo (lectura) de la pantalla Existencias del desktop.
 */

import { z } from 'zod';

/** Query params de GET /api/stock-items. */
export const getStockItemsSchema = z.object({
    productId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetStockItemsQuery = z.infer<typeof getStockItemsSchema>;
