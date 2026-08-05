/**
 * @fileoverview Query del listado de operadores (lectura web).
 * @module Operator/Schemas/GetOperators
 */

import { z } from 'zod';

/** Un operador inactivo no entra, pero se conserva por trazabilidad. */
export const OPERATOR_ACTIVE_FILTERS = ['ACTIVE', 'INACTIVE'] as const;

export const getOperatorsSchema = z.object({
    status: z.enum(OPERATOR_ACTIVE_FILTERS).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetOperatorsQuery = z.infer<typeof getOperatorsSchema>;
