/**
 * @fileoverview Zod schema para query params del listado de existencias.
 * @module Contracts/Inventory
 *
 * GET /api/stock-items — lista paginada con filtros opcionales de producto y
 * bodega. Espejo (lectura) de la pantalla Existencias del desktop.
 */

import { z } from 'zod';

/**
 * Estado de la existencia contra su nivel (ver `stockLevel.schema.ts`). Derivado: filtro de la
 * lista y pastilla del renglón.
 */
export const STOCK_ITEM_LEVEL_STATUSES = ['NEGATIVE', 'OUT', 'LOW', 'OK', 'OVER'] as const;
export type StockItemLevelStatus = (typeof STOCK_ITEM_LEVEL_STATUSES)[number];

/** Query params de GET /api/stock-items. */
export const getStockItemsSchema = z.object({
    productId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    /** Nombre, código o código de barras. */
    search: z.string().trim().max(100).optional(),
    levelStatus: z.enum(STOCK_ITEM_LEVEL_STATUSES).optional(),
    /** Ocultar los renglones en cero (por defecto se ven: un cero también es dato). */
    onlyWithStock: z.coerce.boolean().optional(),
    /** Solo productos con lotes que caducan en N días. */
    expiresWithinDays: z.coerce.number().int().min(0).max(3650).optional(),
    sort: z.enum(['name', 'onHand', 'value', 'lastMovementAt']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetStockItemsQuery = z.infer<typeof getStockItemsSchema>;
