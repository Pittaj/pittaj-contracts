/**
 * @fileoverview Zod schema para el path param :id de impuestos.
 * @module Contracts/Tax
 */

import { z } from 'zod';

/** Valida el path param :id (UUID). */
export const taxIdParamSchema = z.object({
    id: z.string().uuid({ message: 'El ID del impuesto debe ser un UUID válido' }),
});

export type TaxIdParam = z.infer<typeof taxIdParamSchema>;
