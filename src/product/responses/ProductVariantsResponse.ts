/**
 * @fileoverview La matriz de variantes y los componentes de un producto.
 * @module Contracts/Product/Responses/ProductVariants
 */

import type { VariantAttributeInput } from '../schemas/productVariants.schema.js';
import type { InventoryPostingInfo } from '../../inventory/schemas/inventoryAccounting.schema.js';

export interface ProductVariantResponse {
    readonly id: string;
    readonly parentProductId: string;
    readonly values: Readonly<Record<string, string>>;
    /** «Playera básica · M · Negro». */
    readonly displayName: string;
    readonly code: string;
    readonly sku: string | null;
    readonly barcode: string | null;
    /** Efectivos (propios o heredados) y si son propios. */
    readonly salePrice: number;
    readonly costPrice: number;
    readonly ownPrice: boolean;
    readonly active: boolean;
    /** Existencia total en todas las bodegas (derivada). */
    readonly onHand: number;
}

export interface ProductVariantsResponse {
    readonly productId: string;
    readonly attributes: readonly VariantAttributeInput[];
    readonly variants: readonly ProductVariantResponse[];
    readonly version: number;
}

export interface ProductComponentResponse {
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    readonly unitId: string | null;
    readonly unitName: string | null;
    readonly quantity: number;
    readonly substituteGroup: string | null;
    /** Costo del componente × cantidad, al promedio vigente. */
    readonly lineCost: number;
    /** Existencia del componente en la bodega por defecto: cuántos kits alcanzan. */
    readonly onHand: number;
}

export interface ProductComponentsResponse {
    readonly productId: string;
    readonly components: readonly ProductComponentResponse[];
    /** Σ lineCost: el costo del kit armado. */
    readonly totalCost: number;
    /** Cuántos kits se pueden armar con lo que hay (el componente que menos alcanza). */
    readonly buildable: number;
    readonly version: number;
}

/**
 * Un armado (o desarmado) de kits: folio `K`, la salida de cada componente y la entrada del kit
 * al costo sumado. Contabilidad lo postea como una orden de producción de un renglón: si la
 * cuenta de los componentes y la del kit son la misma (lo normal en retail), no hay nada que
 * asentar (`SKIPPED`).
 */
export interface KitAssemblyResponse {
    readonly id: string;
    /** `KW-00003`. */
    readonly assemblyNumber: string;
    readonly kitProductId: string;
    readonly kitProductName: string;
    readonly warehouseId: string;
    readonly warehouseName: string;
    /** Positivo = armado; negativo = desarmado. */
    readonly quantity: number;
    readonly unitCost: number;
    readonly components: readonly {
        readonly productId: string;
        readonly productName: string;
        readonly quantity: number;
        readonly unitCost: number;
    }[];
    readonly effectiveAt: string;
    readonly createdByName: string | null;
    readonly posting: InventoryPostingInfo | null;
    readonly createdAt: string;
}
