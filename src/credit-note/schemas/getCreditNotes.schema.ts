/**
 * @fileoverview Zod schema para query params del listado de notas de crédito.
 * @module Contracts/CreditNote
 *
 * GET /api/credit-notes — lista paginada (orden por creación desc) con filtro opcional
 * de estado (ACTIVE/REDEEMED/EXPIRED/CANCELLED). Espejo (lectura) de la lista de Notas
 * de Crédito del desktop. C4: también por folio o por cliente (la capa F9 › N de la caja).
 */

import { z } from 'zod';
import { CREDIT_NOTE_STATUSES } from '../primitives/creditNotePrimitives.js';

/** Query params de GET /api/credit-notes. */
export const getCreditNotesSchema = z.object({
    status: z.enum(CREDIT_NOTE_STATUSES).optional(),
    /** C4 · Parte del folio (`NC-…`), sin distinguir mayúsculas. Lo que la caja teclea al buscar. */
    folio: z.string().trim().min(1).max(30).optional(),
    /** C4 · Solo las notas de este cliente. */
    customerId: z.string().max(36).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetCreditNotesQuery = z.infer<typeof getCreditNotesSchema>;
