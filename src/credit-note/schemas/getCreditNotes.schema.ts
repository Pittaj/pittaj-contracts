/**
 * @fileoverview Zod schema para query params del listado de notas de crédito.
 * @module Contracts/CreditNote
 *
 * GET /api/credit-notes — lista paginada (orden por creación desc) con filtro opcional
 * de estado (ACTIVE/REDEEMED/EXPIRED/CANCELLED). Espejo (lectura) de la lista de Notas
 * de Crédito del desktop.
 */

import { z } from 'zod';
import { CREDIT_NOTE_STATUSES } from '../primitives/creditNotePrimitives';

/** Query params de GET /api/credit-notes. */
export const getCreditNotesSchema = z.object({
    status: z.enum(CREDIT_NOTE_STATUSES).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetCreditNotesQuery = z.infer<typeof getCreditNotesSchema>;
