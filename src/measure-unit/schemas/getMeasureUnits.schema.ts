/**
 * @fileoverview Zod schema para query params del listado de unidades de medida.
 * @module Contracts/MeasureUnit
 */

import { z } from 'zod';
import { MEASURE_UNIT_STATUSES } from './createMeasureUnit.schema';

/**
 * Query params de GET /measure-units.
 * El catálogo es pequeño (como taxes): sin paginación,
 * solo filtro por status y búsqueda por nombre.
 */
export const getMeasureUnitsSchema = z.object({
    status: z.enum(MEASURE_UNIT_STATUSES).optional(),
    search: z.string().trim().max(50).optional(),
});

export type GetMeasureUnitsQuery = z.infer<typeof getMeasureUnitsSchema>;
