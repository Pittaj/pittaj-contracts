/**
 * @fileoverview DTO de respuesta para el listado paginado de existencias.
 * @module Contracts/Inventory
 */

import type { StockItemResponse } from './StockItemResponse.js';
import type { StockItemLevelStatus } from '../schemas/getStockItems.schema.js';

/** Respuesta de GET /api/stock-items (lista paginada). */
export interface GetStockItemsResponse {
    readonly items: StockItemResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /**
     * (1.20.0, opcional) Cuántos renglones hay en cada estado con los demás filtros puestos pero
     * **sin** el de estado: son los cajones de arriba de la lista, y cada uno pone ese filtro.
     */
    readonly byLevelStatus?: Readonly<Partial<Record<StockItemLevelStatus, number>>>;
    /** (1.20.0, opcional) Σ existencia × costo de todo lo filtrado, no solo de la página. */
    readonly totalValue?: number;
}
