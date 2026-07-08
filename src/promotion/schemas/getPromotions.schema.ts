/**
 * @fileoverview Zod schema para query params del listado de promociones.
 * @module Contracts/Promotion
 *
 * GET /api/promotions — lista paginada (orden por prioridad desc, luego nombre asc)
 * con filtros opcionales de estado, tipo (PERCENT/AMOUNT/NXM/SPECIAL_PRICE) y alcance
 * (PRODUCT/CATEGORY/TICKET). Espejo (lectura) de la lista de Promociones del desktop
 * (PromotionListPage).
 */

import { z } from 'zod';

/** Estados de la promoción (espejo de PromotionStatus). */
export const PROMOTION_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

/** Tipo de descuento (espejo de PromotionType). */
export const PROMOTION_TYPES = ['PERCENT', 'AMOUNT', 'NXM', 'SPECIAL_PRICE'] as const;

/** Alcance de la promoción (espejo de PromotionScope). */
export const PROMOTION_SCOPES = ['PRODUCT', 'CATEGORY', 'TICKET'] as const;

/** Query params de GET /api/promotions. */
export const getPromotionsSchema = z.object({
    status: z.enum(PROMOTION_STATUSES).optional(),
    type: z.enum(PROMOTION_TYPES).optional(),
    scope: z.enum(PROMOTION_SCOPES).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetPromotionsQuery = z.infer<typeof getPromotionsSchema>;
