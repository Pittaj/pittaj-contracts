/**
 * @fileoverview DTO de respuesta para el listado paginado de existencias.
 * @module Contracts/Inventory
 */

import type { StockItemResponse } from './StockItemResponse';

/** Respuesta de GET /api/stock-items (lista paginada). */
export interface GetStockItemsResponse {
    readonly items: StockItemResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
