/**
 * @fileoverview Zod schema para query params del listado de series.
 * @module Contracts/DocumentSeries
 */

import { z } from 'zod';
import { DOCUMENT_TYPES } from './createDocumentSeries.schema';

/**
 * Query params de GET /document-series.
 * Catálogo pequeño (como en desktop): sin paginación.
 */
export const getDocumentSeriesSchema = z.object({
    docType: z.enum(DOCUMENT_TYPES).optional(),
    /** 'true' para filtrar solo series activas (query string). */
    onlyActive: z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export type GetDocumentSeriesQuery = z.infer<typeof getDocumentSeriesSchema>;
