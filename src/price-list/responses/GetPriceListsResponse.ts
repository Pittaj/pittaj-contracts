/**
 * @fileoverview DTO de respuesta para el listado paginado de listas de precios.
 * @module Contracts/PriceList
 */

import type { PriceListResponse } from './PriceListResponse';

/** Respuesta de GET /api/price-lists (lista paginada). */
export interface GetPriceListsResponse {
    readonly items: PriceListResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
