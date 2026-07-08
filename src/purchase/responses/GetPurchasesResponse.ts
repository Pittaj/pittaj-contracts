/**
 * @fileoverview DTO de respuesta para el listado paginado de compras.
 * @module Contracts/Purchase
 */

import type { PurchaseResponse } from './PurchaseResponse';

/** Respuesta de GET /api/purchases (lista paginada). */
export interface GetPurchasesResponse {
    readonly items: PurchaseResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
