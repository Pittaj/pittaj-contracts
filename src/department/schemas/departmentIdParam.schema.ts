/**
 * @fileoverview Zod schema para el path param :id de departamentos.
 * @module Contracts/Department
 */

import { z } from 'zod';

/** Valida el path param :id (UUID). */
export const departmentIdParamSchema = z.object({
    id: z.string().uuid({ message: 'El ID del departamento debe ser un UUID válido' }),
});

export type DepartmentIdParam = z.infer<typeof departmentIdParamSchema>;
