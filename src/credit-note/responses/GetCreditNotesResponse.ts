/**
 * @fileoverview DTO de respuesta para el listado paginado de notas de crédito.
 * @module Contracts/CreditNote
 */

import type { CreditNoteResponse } from './CreditNoteResponse';

/** Respuesta de GET /api/credit-notes (lista paginada). */
export interface GetCreditNotesResponse {
    readonly items: CreditNoteResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
