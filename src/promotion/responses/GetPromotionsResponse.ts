/**
 * @fileoverview DTO de respuesta para el listado paginado de promociones.
 * @module Contracts/Promotion
 */

import type { PromotionResponse } from './PromotionResponse';

/** Respuesta de GET /api/promotions (lista paginada). */
export interface GetPromotionsResponse {
    readonly items: PromotionResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
