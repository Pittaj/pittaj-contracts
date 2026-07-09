/**
 * @fileoverview Zod schema para el parámetro :id del recurso Layaway.
 * @module Contracts/Layaway
 *
 * Usado por GET /api/layaways/:id y los comandos POST /:id/* (UUID como identificador).
 */

import { z } from 'zod';

/** Valida el parámetro `:id` (UUID) de la URL. */
export const layawayIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type LayawayIdParam = z.infer<typeof layawayIdParamSchema>;
