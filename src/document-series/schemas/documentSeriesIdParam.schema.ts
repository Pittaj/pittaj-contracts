/**
 * @fileoverview Zod schema para el path param :id de series.
 * @module Contracts/DocumentSeries
 */

import { z } from 'zod';

/** Valida el path param :id (UUID). */
export const documentSeriesIdParamSchema = z.object({
    id: z.string().uuid({ message: 'El ID de la serie debe ser un UUID válido' }),
});

export type DocumentSeriesIdParam = z.infer<typeof documentSeriesIdParamSchema>;
