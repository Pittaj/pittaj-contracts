/**
 * @fileoverview Filtros de la Bitácora del negocio (`GET /api/bitacora`).
 * @module Contracts/Audit/Schemas
 */

import { z } from 'zod';
import { OPERACIONES_DE_BITACORA, ORIGENES_DE_BITACORA } from '../bitacora.js';

/**
 * `tipo` es la clave de `TIPOS_DE_BITACORA`, no el nombre crudo de una tabla.
 *
 * `desde` y `hasta` son instantes: el cliente pone los límites del día en su zona.
 *
 * Las acciones de la web no traen empresa ni sucursal. Por eso, al filtrar por empresa o sucursal
 * solo quedan las de las instalaciones.
 */
export const getBitacoraSchema = z.object({
    origen: z.enum(ORIGENES_DE_BITACORA).optional(),
    instalacionId: z.string().max(100).optional(),
    companyId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
    tipo: z.string().max(60).optional(),
    operacion: z.enum([...OPERACIONES_DE_BITACORA, 'otra']).optional(),
    desde: z.string().datetime({ offset: true }).optional(),
    hasta: z.string().datetime({ offset: true }).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type GetBitacoraQuery = z.infer<typeof getBitacoraSchema>;
