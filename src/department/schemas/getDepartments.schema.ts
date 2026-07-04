/**
 * @fileoverview Zod schema para query params del listado de departamentos.
 * @module Contracts/Department
 */

import { z } from 'zod';
import { DEPARTMENT_STATUSES } from './createDepartment.schema';

/**
 * Query params de GET /departments.
 * Catálogo pequeño: sin paginación, solo filtro por status
 * y búsqueda por nombre.
 */
export const getDepartmentsSchema = z.object({
    status: z.enum(DEPARTMENT_STATUSES).optional(),
    search: z.string().trim().max(80).optional(),
});

export type GetDepartmentsQuery = z.infer<typeof getDepartmentsSchema>;
