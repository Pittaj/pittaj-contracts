/**
 * @fileoverview Zod schema para la asignación server-side de folios.
 *
 * El servidor asigna el siguiente folio de una serie ACTIVA (reinicio anual,
 * como en desktop AssignNextFormatted). Usado por la web Caja para tickets
 * con folio autoritativo del servidor.
 *
 * @module Contracts/DocumentSeries
 */

import { z } from 'zod';
import { DOCUMENT_TYPES } from './createDocumentSeries.schema';

const ERROR_MESSAGES = {
    DOC_TYPE_INVALID: 'Tipo de documento inválido',
    YEAR_INVALID: 'El año debe estar entre 2000 y 9999',
} as const;

/**
 * Body de POST /document-series/assign-folio.
 * - docType: tipo de documento de la serie (por defecto TICKET).
 * - year: año para el folio (reinicio anual). Si se omite, el servidor usa el año UTC actual.
 */
export const assignNextFolioSchema = z
    .object({
        docType: z
            .enum(DOCUMENT_TYPES, { errorMap: () => ({ message: ERROR_MESSAGES.DOC_TYPE_INVALID }) })
            .optional()
            .default('TICKET'),
        year: z
            .number()
            .int()
            .min(2000, { message: ERROR_MESSAGES.YEAR_INVALID })
            .max(9999, { message: ERROR_MESSAGES.YEAR_INVALID })
            .optional(),
    })
    .strict();

export type AssignNextFolioRequest = z.infer<typeof assignNextFolioSchema>;
