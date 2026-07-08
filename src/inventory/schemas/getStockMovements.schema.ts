/**
 * @fileoverview Zod schema para query params del listado de movimientos.
 * @module Contracts/Inventory
 *
 * GET /api/stock-movements — lista paginada del ledger (orden occurredAt desc)
 * con filtros opcionales de producto, bodega, dirección, origen y rango de
 * fechas. Espejo (lectura) del kardex/Movimientos del desktop.
 */

import { z } from 'zod';

/** Direcciones del movimiento. */
export const MOVEMENT_DIRECTIONS = ['IN', 'OUT'] as const;

/** Orígenes (source types) del movimiento. */
export const STOCK_SOURCE_TYPES = [
    'SALE',
    'RETURN',
    'PURCHASE',
    'PURCHASE_RETURN',
    'TRANSFER',
    'ADJUSTMENT',
    'COUNT',
    'INITIAL',
    'MERMA',
    'PRODUCTION',
] as const;

/** Query params de GET /api/stock-movements. */
export const getStockMovementsSchema = z.object({
    productId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    direction: z.enum(MOVEMENT_DIRECTIONS).optional(),
    sourceType: z.enum(STOCK_SOURCE_TYPES).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetStockMovementsQuery = z.infer<typeof getStockMovementsSchema>;
