/**
 * @fileoverview DTO de respuesta para DocumentSeries (GET/PUT endpoints).
 *
 * Espejo del DocumentSeriesDto desktop. Los displays (DocTypeDisplay,
 * ScopeDisplay) los deriva el cliente.
 *
 * @module Contracts/DocumentSeries
 */

import type { DocumentType, SeriesScope } from '../schemas/createDocumentSeries.schema';

/** DTO de respuesta para consultas de series. */
export interface DocumentSeriesResponse {
    /** ID único (UUID v4). */
    readonly id: string;

    /** Tipo de documento (inmutable). */
    readonly docType: DocumentType;

    /** Prefijo de la serie (MAYÚSCULAS). */
    readonly serie: string;

    /** Alcance: GLOBAL | BY_REGISTER | BY_BRANCH. */
    readonly scope: SeriesScope;

    /** Clave del alcance (RegisterId/LocationId); null para GLOBAL. */
    readonly scopeKey: string | null;

    /** Folio actual (el siguiente asignado será currentFolio + 1). */
    readonly currentFolio: number;

    /** Año del folio (reinicio anual automático). */
    readonly folioYear: number;

    /** Plantilla del folio, ej. "TKT-{serie}-{folio:00000}". */
    readonly format: string;

    /** Si la serie está activa (las series no se eliminan, se desactivan). */
    readonly isActive: boolean;

    /** Versión para optimistic locking. */
    readonly version: number;

    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;

    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
