/**
 * @fileoverview DTO de respuesta para el listado paginado del buzón.
 * @module Contracts/ReceivedCfdi
 */

import type { ReceivedCfdiResponse } from './ReceivedCfdiResponse.js';

/** Respuesta de GET /api/received-cfdis (lista paginada). */
export interface GetReceivedCfdisResponse {
    readonly items: ReceivedCfdiResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Cuántos hay en cada estado, para los contadores de la bandeja. */
    readonly counts: {
        readonly nuevos: number;
        readonly vinculados: number;
        readonly ignorados: number;
    };
}
