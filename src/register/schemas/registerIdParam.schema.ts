/**
 * @fileoverview Zod schema para el parámetro :id del recurso Register.
 * @module Contracts/Register
 *
 * Usado por GET /api/registers/:id (UUID como identificador).
 */

import { z } from 'zod';

/** Valida el parámetro `:id` (UUID) de la URL. */
export const registerIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type RegisterIdParam = z.infer<typeof registerIdParamSchema>;
