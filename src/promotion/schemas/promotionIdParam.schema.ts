/**
 * @fileoverview Zod schema para el parámetro :id del recurso Promotion.
 * @module Contracts/Promotion
 *
 * Usado por GET /api/promotions/:id (UUID como identificador).
 */

import { z } from 'zod';

/** Valida el parámetro `:id` (UUID) de la URL. */
export const promotionIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type PromotionIdParam = z.infer<typeof promotionIdParamSchema>;
