/**
 * @fileoverview DTO de respuesta de la resolución de precio (caja web).
 *
 * Espejo del PriceResolution del desktop (Pittaj.Application/PriceLists), ampliado
 * con la procedencia (source) y la lista aplicada para trazabilidad en la caja.
 *
 * @module Contracts/PriceList
 */

/** Procedencia del precio resuelto (precedencia de lista o precio base del producto). */
export type ResolvePriceSource =
    | 'CUSTOMER_LIST'
    | 'LOCATION_LIST'
    | 'DEFAULT_LIST'
    | 'BASE_PRICE';

/** Resultado de POST /api/price-lists/resolve. */
export interface ResolvePriceResponse {
    /** Precio unitario resuelto (por unidad de venta), ya con piso aplicado. */
    readonly unitPrice: number;
    /** Moneda del precio (de la lista aplicada, o del producto en BASE_PRICE). */
    readonly currency: string;
    /** De dónde salió el precio. */
    readonly source: ResolvePriceSource;
    /** Factor de la unidad de venta respecto a la unidad base (1 = base). */
    readonly unitFactor: number;
    /** Lista aplicada (null en BASE_PRICE). */
    readonly priceListId: string | null;
    /** Nombre de la lista aplicada (null en BASE_PRICE). */
    readonly priceListName: string | null;
    /** minQty del escalón por volumen que aplicó (null = precio base / FORMULA). */
    readonly appliedMinQty: number | null;
}
