/**
 * @fileoverview DTO de respuesta para el listado paginado de movimientos.
 * @module Contracts/Inventory
 */

import type { StockMovementResponse } from './StockMovementResponse';

/** Respuesta de GET /api/stock-movements (lista paginada). */
export interface GetStockMovementsResponse {
    readonly items: StockMovementResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
