/**
 * @fileoverview Respuesta de la lista de notas a proveedor.
 * @module Contracts/SupplierNote/Responses
 */

import type { SupplierNoteResponse } from './SupplierNoteResponse.js';

/** GET /api/supplier-notes — lista paginada. */
export interface GetSupplierNotesResponse {
    readonly items: readonly SupplierNoteResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
