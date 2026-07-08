/**
 * @fileoverview DTO de respuesta para el listado paginado de cajeros.
 * @module Contracts/Cashier
 */

import type { CashierResponse } from './CashierResponse';

/** Respuesta de GET /api/cashiers (lista paginada). */
export interface GetCashiersResponse {
    readonly items: CashierResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
