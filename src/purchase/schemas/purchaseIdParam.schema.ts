/**
 * @fileoverview Zod schema para el parámetro :id del recurso Purchase.
 * @module Contracts/Purchase
 *
 * Usado por GET /api/purchases/:id (UUID como identificador).
 */

import { z } from 'zod';

/** Valida el parámetro `:id` (UUID) de la URL. */
export const purchaseIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type PurchaseIdParam = z.infer<typeof purchaseIdParamSchema>;
