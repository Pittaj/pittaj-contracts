/**
 * @fileoverview Zod schema para la resolución de precio en la caja (web).
 * @module Contracts/PriceList/Schemas/ResolvePrice
 *
 * POST /api/price-lists/resolve — resuelve el precio unitario de un producto
 * para una cantidad/unidad, aplicando la lista pertinente (preferida/cliente →
 * de la sucursal → default) con escalones por volumen y piso de MinSalePrice.
 * Espejo del PriceResolver del desktop (Pittaj.Application/PriceLists).
 *
 * NOTA: el tenant NO viaja en el body — se toma del JWT (child container),
 * igual que el resto del módulo.
 */

import { z } from 'zod';

/** Body de POST /api/price-lists/resolve. */
export const resolvePriceSchema = z.object({
    /** Producto a cotizar. */
    productId: z.string().uuid(),
    /** Cantidad de la unidad de venta (para escalones por volumen). */
    quantity: z.coerce.number().positive(),
    /** Unidad de venta (null/omitida = unidad base). */
    unitName: z.string().trim().min(1).max(30).optional().nullable(),
    /** Cliente (reservado; el vínculo cliente→lista viaja como preferredListId). */
    customerId: z.string().uuid().optional().nullable(),
    /** Sucursal cuya lista base se usa cuando no hay lista preferida. */
    locationId: z.string().uuid().optional().nullable(),
    /** Lista preferida (cliente/selector). Máxima precedencia si es usable. */
    preferredListId: z.string().uuid().optional().nullable(),
});

export type ResolvePriceRequest = z.infer<typeof resolvePriceSchema>;
