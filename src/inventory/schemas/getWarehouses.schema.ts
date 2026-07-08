/**
 * @fileoverview Zod schema para query params del listado de bodegas.
 * @module Contracts/Inventory
 *
 * GET /api/warehouses — lista paginada con filtros opcionales de estado y
 * sucursal. Espejo (lectura) del catálogo de bodegas del desktop.
 */

import { z } from 'zod';

/** Estados posibles de una bodega. */
export const WAREHOUSE_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

/** Query params de GET /api/warehouses. */
export const getWarehousesSchema = z.object({
    status: z.enum(WAREHOUSE_STATUSES).optional(),
    locationId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetWarehousesQuery = z.infer<typeof getWarehousesSchema>;
