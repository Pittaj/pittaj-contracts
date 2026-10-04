/**
 * @fileoverview Schemas Zod del resultado operativo.
 * @module operating-result/schemas
 */

import { z } from 'zod';

/** Fecha en formato ISO (YYYY-MM-DD). */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato YYYY-MM-DD');

/**
 * Días que admite una consulta.
 *
 * 400 cubre el año más el mes de gracia del cierre. Más allá, la rejilla deja
 * de caber en una pantalla y la consulta deja de ser un reporte para volverse
 * una exportación — que es otra cosa y tiene su propio botón.
 */
export const MAX_RESULT_DAYS = 400;

/** GET /api/operating-result — el rango, día por día. */
export const getOperatingResultSchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
  /** Acota a una sucursal; sin ella, todas. */
  locationId: z.string().uuid().optional(),
  /**
   * F1.6 · Acota a una línea de negocio; `NONE` es «Sin línea». Las ventas y el costo se
   * suman por renglón (un ticket mixto aporta solo lo suyo) y los gastos siguen a la línea
   * de su cuenta de banco.
   */
  businessLineId: z.union([z.string().uuid(), z.literal('NONE')]).optional(),
});

export type GetOperatingResultInput = z.infer<typeof getOperatingResultSchema>;
