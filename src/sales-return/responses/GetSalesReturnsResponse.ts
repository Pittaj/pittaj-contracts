/**
 * @fileoverview DTO de respuesta para el listado paginado de devoluciones.
 * @module Contracts/SalesReturn
 */

import type { SalesReturnResponse } from './SalesReturnResponse';

/** Respuesta de GET /api/sales-returns (lista paginada). */
export interface GetSalesReturnsResponse {
    readonly items: SalesReturnResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
