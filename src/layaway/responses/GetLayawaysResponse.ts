/**
 * @fileoverview DTO de respuesta para el listado paginado de apartados.
 * @module Contracts/Layaway
 */

import type { LayawayResponse } from './LayawayResponse';

/** Respuesta de GET /api/layaways (lista paginada). */
export interface GetLayawaysResponse {
    readonly items: LayawayResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
