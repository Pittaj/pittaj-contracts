/**
 * @fileoverview Zod schema para query params del listado de listas de precios.
 * @module Contracts/PriceList
 *
 * GET /api/price-lists — lista paginada (orden por nombre asc) con filtros
 * opcionales de estado, modo (EXPLICIT/FORMULA), predeterminada y sucursal.
 * Espejo (lectura) de la lista de Listas de Precios del desktop (ListasPreciosPage).
 */

import { z } from 'zod';

/** Estados de la lista (espejo de PriceListStatus). */
export const PRICE_LIST_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

/** Modo de la lista (espejo de PriceListMode). */
export const PRICE_LIST_MODES = ['EXPLICIT', 'FORMULA'] as const;

/** Query params de GET /api/price-lists. */
export const getPriceListsSchema = z.object({
    status: z.enum(PRICE_LIST_STATUSES).optional(),
    mode: z.enum(PRICE_LIST_MODES).optional(),
    isDefault: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
    locationId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetPriceListsQuery = z.infer<typeof getPriceListsSchema>;
