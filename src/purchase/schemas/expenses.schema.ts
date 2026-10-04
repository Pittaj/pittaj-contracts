/**
 * @fileoverview Query params de la lista de gastos y del reporte por concepto (F6.4).
 * @module Contracts/Purchase
 *
 * Los dos cortan por **mes** (`YYYY-MM`) y no por fecha suelta: la pregunta es «¿cuánto se me
 * fue en luz en septiembre?», y el mes del gasto es el de la póliza (la recepción, en hora de
 * México). Los dos aceptan sucursal y línea, que son los ejes que F7 va a recortar por usuario
 * (6.8): se construyen ya con ellos para no volver a tocarlos.
 */

import { z } from 'zod';

/** `YYYY-MM`. */
export const MES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const mes = z.string().regex(MES_REGEX, 'Formato AAAA-MM');

/**
 * Filtro de concepto de la lista. Un UUID, o `NONE` para «sin concepto» — lo que cae en
 * Otros gastos, sea porque el renglón no dice nada o porque dice «Otros gastos».
 */
export const SIN_CONCEPTO = 'NONE' as const;

/** GET /api/purchases/expenses */
export const getExpensesSchema = z.object({
    /** Primer mes (incluido). */
    desde: mes,
    /** Último mes (incluido). Por omisión, el mismo que `desde`. */
    hasta: mes.optional(),
    locationId: z.string().uuid().optional(),
    businessLineId: z.string().uuid().optional(),
    expenseConceptId: z.union([z.string().uuid(), z.literal(SIN_CONCEPTO)]).optional(),
    /** Folio, proveedor, folio del comprobante. */
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetExpensesQuery = z.infer<typeof getExpensesSchema>;

/** Cuántos meses caben en el reporte: dos años, para comparar un mes contra el del año pasado. */
export const MAX_MESES_DEL_REPORTE = 24;

/** GET /api/purchases/expenses/by-concept */
export const getExpensesByConceptSchema = z.object({
    desde: mes,
    hasta: mes,
    locationId: z.string().uuid().optional(),
    businessLineId: z.string().uuid().optional(),
});

export type GetExpensesByConceptQuery = z.infer<typeof getExpensesByConceptSchema>;
