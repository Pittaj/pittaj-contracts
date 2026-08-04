/**
 * @fileoverview DTO de respuesta para el listado paginado de bodegas.
 * @module Contracts/Inventory
 */

import type { WarehouseResponse } from './WarehouseResponse.js';

/** Respuesta de GET /api/warehouses (lista paginada). */
export interface GetWarehousesResponse {
    readonly items: WarehouseResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
