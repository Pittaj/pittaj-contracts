/**
 * @fileoverview Zod schema para el path param :id de líneas de negocio.
 * @module Contracts/BusinessLine
 */

import { z } from 'zod';

/** Valida el path param :id (UUID). */
export const businessLineIdParamSchema = z.object({
    id: z.string().uuid({ message: 'El ID de la línea de negocio debe ser un UUID válido' }),
});

export type BusinessLineIdParam = z.infer<typeof businessLineIdParamSchema>;
