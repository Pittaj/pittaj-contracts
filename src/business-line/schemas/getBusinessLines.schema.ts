/**
 * @fileoverview Zod schema para query params del listado de líneas de negocio.
 * @module Contracts/BusinessLine
 */

import { z } from 'zod';
import { BUSINESS_LINE_STATUSES } from './createBusinessLine.schema.js';

/**
 * Query params de GET /business-lines.
 * Catálogo pequeño (un puñado de giros): sin paginación.
 */
export const getBusinessLinesSchema = z.object({
    status: z.enum(BUSINESS_LINE_STATUSES).optional(),
    search: z.string().trim().max(80).optional(),
});

export type GetBusinessLinesQuery = z.infer<typeof getBusinessLinesSchema>;

/**
 * Valor del filtro «Sin línea» en los reportes. Un reporte filtrado por línea
 * recibe `businessLineId=<uuid>` o `businessLineId=none`; sin el parámetro, no
 * filtra (todas las líneas, incluido lo que no tiene).
 */
export const BUSINESS_LINE_FILTER_NONE = 'none' as const;

/** Filtro por línea de negocio en query params de reportes. */
export const businessLineFilterSchema = z
    .union([z.string().uuid(), z.literal(BUSINESS_LINE_FILTER_NONE)])
    .optional();

export type BusinessLineFilter = z.infer<typeof businessLineFilterSchema>;
