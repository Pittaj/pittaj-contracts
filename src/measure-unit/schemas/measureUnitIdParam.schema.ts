/**
 * @fileoverview Zod schema para el path param :id de unidades de medida.
 * @module Contracts/MeasureUnit
 */

import { z } from 'zod';

/** Valida el path param :id (UUID). */
export const measureUnitIdParamSchema = z.object({
    id: z
        .string()
        .uuid({ message: 'El ID de la unidad de medida debe ser un UUID válido' }),
});

export type MeasureUnitIdParam = z.infer<typeof measureUnitIdParamSchema>;
