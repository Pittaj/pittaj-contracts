/**
 * @fileoverview Response DTO para GetProductById query
 * @module queries/get-by-id
 * @version 1.0.0
 *
 * Define la estructura de respuesta al consultar un producto por ID.
 * Co-ubicado con la query y handler para cohesión.
 */

import type { ProductPricePrimitives } from '../primitives/index.js';
import type { ProductInventoryConfigPrimitives } from '../primitives/index.js';
import type { ProductTaxInfoPrimitives } from '../primitives/index.js';
import type { ProductPosConfigPrimitives } from '../primitives/index.js';
import type { ProductUnitPrimitives } from '../primitives/index.js';
import type { AttributeValue } from '../primitives/index.js';

/**
 * Response DTO para consulta de producto individual.
 *
 * Retorna todos los datos de un producto incluyendo auditoría.
 *
 * @interface ProductResponse
 * @since 1.0.0
 */
export interface ProductResponse {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly sku: string | null;
    readonly barcode: string | null;
    /**
     * Fusionado en otro producto: este era el repetido y aquel se quedó con todo.
     *
     * Viaja en el sync para que la otra plataforma haga su propio barrido: una marca sin barrido
     * dejaría allí un producto inactivo con su historial intacto, que es peor que no sincronizar.
     */
    readonly mergedIntoId: string | null;
    readonly type: string;
    readonly status: string;
    readonly price: ProductPricePrimitives;
    readonly description: string | null;
    /** Descripción corta (del desktop). */
    readonly shortDescription: string | null;
    /** Aparece en búsquedas de venta; false = insumo (del desktop). */
    readonly canBeSold: boolean;
    /** Aparece en búsquedas de compra; false = no se compra (del desktop). */
    readonly canBePurchased: boolean;
    /** Unidades de venta alternas (del desktop). */
    readonly units: ProductUnitPrimitives[];
    readonly tags: string[];
    readonly weight: number | null;
    readonly attributes: Record<string, AttributeValue>;
    readonly inventoryConfig: ProductInventoryConfigPrimitives;
    readonly taxInfo: ProductTaxInfoPrimitives;
    readonly posConfig: ProductPosConfigPrimitives;
    readonly categoryId: string | null;
    /** Línea de negocio propia (null = hereda la de la categoría). */
    readonly businessLineId?: string | null;
    readonly tenantId: string;
    readonly createdAt: Date;
    readonly createdBy: string | null;
    readonly updatedAt: Date | null;
    readonly updatedBy: string | null;
    readonly version: number;
}
