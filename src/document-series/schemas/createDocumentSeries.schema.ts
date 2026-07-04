/**
 * @fileoverview Zod schemas para crear/actualizar series de documentos.
 *
 * Réplica del dominio desktop (Pittaj.Domain/Numbering/DocumentSeries):
 * - serie: prefijo ≤10 chars (el backend normaliza a MAYÚSCULAS)
 * - format: plantilla que DEBE contener "{folio" (ej. "TKT-{serie}-{folio:00000}")
 * - docType y folio inicial son INMUTABLES tras la creación
 * - las series no se eliminan: se desactivan
 *
 * @module Contracts/DocumentSeries
 */

import { z } from 'zod';

/** Tipos de documento (enum del dominio desktop DocumentType). */
export const DOCUMENT_TYPES = [
    'TICKET',
    'INVOICE',
    'CREDIT_NOTE',
    'PAYMENT',
    'RECEIPT',
    'TRANSFER',
    'ADJUSTMENT',
    'QUOTE',
    'ORDER',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Alcances de la serie (enum SeriesScope). BY_REGISTER = una serie por caja (offline sin colisión). */
export const SERIES_SCOPES = ['GLOBAL', 'BY_REGISTER', 'BY_BRANCH'] as const;
export type SeriesScope = (typeof SERIES_SCOPES)[number];

const ERROR_MESSAGES = {
    ID_INVALID_UUID: 'El ID debe ser un UUID válido',
    DOC_TYPE_INVALID: 'Tipo de documento inválido',
    SERIE_REQUIRED: 'La serie es requerida',
    SERIE_TOO_LONG: 'La serie no puede exceder 10 caracteres',
    SCOPE_INVALID: 'Alcance inválido. Use: GLOBAL, BY_REGISTER o BY_BRANCH',
    SCOPE_KEY_TOO_LONG: 'La clave de alcance no puede exceder 100 caracteres',
    FORMAT_REQUIRED: 'El formato es requerido',
    FORMAT_TOO_LONG: 'El formato no puede exceder 100 caracteres',
    FORMAT_NEEDS_FOLIO: 'El formato debe contener el placeholder {folio}',
    START_FOLIO_MIN: 'El folio inicial debe ser 0 o mayor',
} as const;

const baseSeriesFields = {
    /** Prefijo de la serie (se normaliza a MAYÚSCULAS en el backend). */
    serie: z
        .string({ required_error: ERROR_MESSAGES.SERIE_REQUIRED })
        .trim()
        .min(1, { message: ERROR_MESSAGES.SERIE_REQUIRED })
        .max(10, { message: ERROR_MESSAGES.SERIE_TOO_LONG }),

    /** Alcance de la serie. */
    scope: z.enum(SERIES_SCOPES, { errorMap: () => ({ message: ERROR_MESSAGES.SCOPE_INVALID }) }),

    /** Clave del alcance (RegisterId/LocationId); null/omitida para GLOBAL. */
    scopeKey: z.string().trim().max(100, { message: ERROR_MESSAGES.SCOPE_KEY_TOO_LONG }).nullish(),

    /** Plantilla del folio, ej. "TKT-{serie}-{folio:00000}". */
    format: z
        .string({ required_error: ERROR_MESSAGES.FORMAT_REQUIRED })
        .trim()
        .min(1, { message: ERROR_MESSAGES.FORMAT_REQUIRED })
        .max(100, { message: ERROR_MESSAGES.FORMAT_TOO_LONG })
        .refine((f) => f.includes('{folio'), { message: ERROR_MESSAGES.FORMAT_NEEDS_FOLIO }),
};

/**
 * Schema para crear una serie.
 * El id lo genera el cliente (offline-first).
 */
export const createDocumentSeriesSchema = z
    .object({
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        /** Tipo de documento (inmutable tras crear). */
        docType: z.enum(DOCUMENT_TYPES, { errorMap: () => ({ message: ERROR_MESSAGES.DOC_TYPE_INVALID }) }),
        ...baseSeriesFields,
        /** Folio inicial (inmutable tras crear). */
        startFolio: z.number().int().min(0, { message: ERROR_MESSAGES.START_FOLIO_MIN }).optional().default(0),
    })
    .strict();

export type CreateDocumentSeriesRequest = z.infer<typeof createDocumentSeriesSchema>;

/**
 * Schema para actualizar una serie.
 * Como en desktop, NO cambia docType ni folio (inmutables en edición).
 */
export const updateDocumentSeriesSchema = z
    .object({
        ...baseSeriesFields,
        /** Versión actual para optimistic locking. */
        version: z.number().int().min(1),
    })
    .strict();

export type UpdateDocumentSeriesRequest = z.infer<typeof updateDocumentSeriesSchema>;
