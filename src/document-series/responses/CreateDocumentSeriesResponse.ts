/**
 * @fileoverview Respuesta slim de POST /document-series.
 * @module Contracts/DocumentSeries
 */

/** Respuesta de creación: solo el id confirmado. */
export interface CreateDocumentSeriesResponse {
    readonly id: string;
}
