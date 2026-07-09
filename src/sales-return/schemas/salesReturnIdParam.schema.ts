/**
 * @fileoverview Zod schema para el parámetro :id del recurso SalesReturn.
 * @module Contracts/SalesReturn
 *
 * Usado por GET /api/sales-returns/:id (UUID como identificador).
 */

import { z } from 'zod';

/** Valida el parámetro `:id` (UUID) de la URL. */
export const salesReturnIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type SalesReturnIdParam = z.infer<typeof salesReturnIdParamSchema>;
