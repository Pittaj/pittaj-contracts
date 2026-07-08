/**
 * @fileoverview Zod schema para el parámetro :id del recurso PriceList.
 * @module Contracts/PriceList
 *
 * Usado por GET /api/price-lists/:id (UUID como identificador).
 */

import { z } from 'zod';

/** Valida el parámetro `:id` (UUID) de la URL. */
export const priceListIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type PriceListIdParam = z.infer<typeof priceListIdParamSchema>;
