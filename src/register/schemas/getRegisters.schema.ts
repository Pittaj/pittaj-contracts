/**
 * @fileoverview Zod schema para query params del listado de cajas registradoras.
 * @module Contracts/Register
 *
 * GET /api/registers — lista paginada (orden por nombre asc) con filtro opcional
 * de estado (ACTIVE/INACTIVE). Espejo (lectura) de la lista de Cajas Registradoras
 * del desktop (RegisterListPage).
 */

import { z } from 'zod';

/** Estados de la caja (espejo de RegisterStatus). */
export const REGISTER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

/** Query params de GET /api/registers. */
export const getRegistersSchema = z.object({
    status: z.enum(REGISTER_STATUSES).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetRegistersQuery = z.infer<typeof getRegistersSchema>;
