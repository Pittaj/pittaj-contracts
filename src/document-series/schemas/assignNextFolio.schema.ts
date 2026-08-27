/**
 * @fileoverview Zod schema para la asignación server-side de folios.
 *
 * El servidor asigna el siguiente folio de la serie ACTIVA del punto de emisión
 * (espejo de desktop `AssignNextFormatted`). Usado por la web Caja para tickets
 * con folio autoritativo del servidor.
 *
 * **Sin reinicio anual**: se quitó de las dos plataformas el 2026-08-08
 * (BUG-005/BUG-017). El `year` se sigue mandando y se guarda como dato, pero ya
 * no devuelve el contador a 1.
 *
 * @module Contracts/DocumentSeries
 */

import { z } from 'zod';
import { DOCUMENT_TYPES } from './createDocumentSeries.schema.js';

const ERROR_MESSAGES = {
    DOC_TYPE_INVALID: 'Tipo de documento inválido',
    YEAR_INVALID: 'El año debe estar entre 2000 y 9999',
} as const;

/**
 * Body de POST /document-series/assign-folio.
 * - docType: tipo de documento de la serie (por defecto TICKET).
 * - year: año del folio (solo dato; ya no reinicia). Si se omite, el servidor usa el año UTC actual.
 * - scopeKey: punto de emisión que folia — la sucursal en la web, la caja en el escritorio
 *   (ADR-018). Si se omite se usa la serie GLOBAL, que es la red y no la serie de nadie.
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
        scopeKey: z.string().min(1).max(100).optional(),
    })
    .strict();

export type AssignNextFolioRequest = z.infer<typeof assignNextFolioSchema>;
