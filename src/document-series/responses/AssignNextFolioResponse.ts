/**
 * @fileoverview DTO de respuesta para la asignación server-side de folios.
 *
 * @module Contracts/DocumentSeries
 */

import type { DocumentType } from '../schemas/createDocumentSeries.schema';

/** Respuesta de POST /document-series/assign-folio. */
export interface AssignNextFolioResponse {
    /** Folio formateado según la plantilla de la serie (ej. "TKT-A-00001"). */
    readonly folio: string;

    /** Tipo de documento de la serie usada. */
    readonly docType: DocumentType;

    /** Folio numérico asignado (tras el reinicio anual, si aplica). */
    readonly currentFolio: number;

    /** Año del folio asignado. */
    readonly folioYear: number;
}
