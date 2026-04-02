/**
 * @fileoverview Response DTO para GetProductById query
 * @module queries/get-by-id
 * @version 1.0.0
 *
 * Define la estructura de respuesta al consultar un producto por ID.
 * Co-ubicado con la query y handler para cohesión.
 */

import type { ProductPricePrimitives } from '../primitives';
import type { ProductInventoryConfigPrimitives } from '../primitives';
import type { ProductTaxInfoPrimitives } from '../primitives';
import type { ProductPosConfigPrimitives } from '../primitives';
import type { AttributeValue } from '../primitives';

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
