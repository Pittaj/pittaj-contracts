/**
 * @fileoverview La matriz de variantes y los componentes de un producto.
 * @module Contracts/Product/Responses/ProductVariants
 */

import type { VariantAttributeInput } from '../schemas/productVariants.schema.js';

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
