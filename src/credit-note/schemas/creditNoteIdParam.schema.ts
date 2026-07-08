/**
 * @fileoverview Zod schema para el parámetro :id del recurso CreditNote.
 * @module Contracts/CreditNote
 *
 * Usado por GET /api/credit-notes/:id y POST /api/credit-notes/:id/redeem (UUID).
 */

import { z } from 'zod';

/** Valida el parámetro `:id` (UUID) de la URL. */
export const creditNoteIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type CreditNoteIdParam = z.infer<typeof creditNoteIdParamSchema>;
