/**
 * @fileoverview Response DTO para CreateProduct command
 * @module commands/create-product
 * @version 1.0.0
 *
 * Define la estructura de respuesta después de crear un producto.
 * Co-ubicado con el command y handler para cohesión.
 */

import type { ProductPricePrimitives } from '../../primitives';
import type { ProductInventoryConfigPrimitives } from '../../primitives';
import type { ProductTaxInfoPrimitives } from '../../primitives';
import type { ProductPosConfigPrimitives } from '../../primitives';
import type { AttributeValue } from '../../primitives';

/**
 * Response DTO para producto creado.
 *
 * Retorna información completa del producto creado para
 * evitar que el cliente tenga que hacer segunda query.
 *
 * @interface CreateProductResponse
 * @since 1.0.0
 */
export interface CreateProductResponse {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly sku: string | null;
    readonly barcode: string | null;
    readonly type: string;
    readonly status: string;
    readonly price: ProductPricePrimitives;
    readonly description: string | null;
    readonly tags: string[];
    readonly weight: number | null;
    readonly attributes: Record<string, AttributeValue>;
    readonly inventoryConfig: ProductInventoryConfigPrimitives;
    readonly taxInfo: ProductTaxInfoPrimitives;
    readonly posConfig: ProductPosConfigPrimitives;
    readonly categoryId: string | null;
    readonly tenantId: string;
    readonly createdAt: Date;
    readonly createdBy: string | null;
    readonly updatedAt: Date | null;
    readonly updatedBy: string | null;
    readonly version: number;
}
