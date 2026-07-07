/**
 * @fileoverview DTO de respuesta para PriceList (sync).
 *
 * Espejo del PriceListDto desktop. Shape que ambos lados serializan/parsean:
 * el desktop lo produce en su Describe (push) y lo consume en ApplyPriceListAsync
 * (pull); la nube lo emite desde PriceListResponseMapper.
 *
 * @module Contracts/PriceList
 */

/** Modo de la lista de precios. */
export type PriceListMode = 'EXPLICIT' | 'FORMULA';

/** Estado de la lista. */
export type PriceListStatus = 'ACTIVE' | 'INACTIVE';

/** Base sobre la que opera la fórmula. */
export type PriceListFormulaBase = 'COST' | 'BASE_PRICE';

/** Operación de la fórmula. */
export type PriceListFormulaOperation = 'MARKUP_PERCENT' | 'DISCOUNT_PERCENT' | 'MARGIN';

/** Regla de cálculo (solo mode=FORMULA). */
export interface PriceListFormula {
    readonly base: PriceListFormulaBase;
    readonly operation: PriceListFormulaOperation;
    readonly value: number;
}

/** Item de precio explícito (producto + precio + escalón de volumen + unidad). */
export interface PriceListItemResponse {
    readonly id: string;
    readonly productId: string;
    readonly price: number;
    /** Cantidad mínima del escalón por volumen (null = precio base). */
    readonly minQty: number | null;
    /** Unidad de venta a la que aplica (null = unidad base). */
    readonly unit: string | null;
}

/** DTO de respuesta para consultas/sync de listas de precios. */
export interface PriceListResponse {
    readonly id: string;
    readonly name: string;
    readonly currency: string;
    readonly isDefault: boolean;
    /** Sucursal dueña (null = general). */
    readonly locationId: string | null;
    readonly status: PriceListStatus;
    readonly mode: PriceListMode;
    /** Fórmula (null en mode=EXPLICIT). */
    readonly formula: PriceListFormula | null;
    /** Vigencia inicial (ISO 8601, null = sin límite). */
    readonly validFrom: string | null;
    /** Vigencia final (ISO 8601, null = sin límite). */
    readonly validTo: string | null;
    /** Items explícitos (vacío en mode=FORMULA). */
    readonly items: PriceListItemResponse[];
    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
