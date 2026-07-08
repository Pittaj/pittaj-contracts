/**
 * @fileoverview Zod schema para el parámetro :id del recurso Cashier.
 * @module Contracts/Cashier
 *
 * Usado por GET /api/cashiers/:id (UUID como identificador).
 */

import { z } from 'zod';

/** Valida el parámetro `:id` (UUID) de la URL. */
export const cashierIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type CashierIdParam = z.infer<typeof cashierIdParamSchema>;
