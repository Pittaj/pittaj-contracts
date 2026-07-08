/**
 * @fileoverview DTO de respuesta para el listado paginado de cajas registradoras.
 * @module Contracts/Register
 */

import type { RegisterResponse } from './RegisterResponse';

/** Respuesta de GET /api/registers (lista paginada). */
export interface GetRegistersResponse {
    readonly items: RegisterResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
