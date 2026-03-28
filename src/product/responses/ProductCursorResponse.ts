/**
 * @fileoverview Respuesta de paginación cursor para productos
 * @module ProductCursorResponse
 * @version 1.0.0
 */

import type { ProductResponse } from './ProductResponse';

/**
 * Tipo reutilizado de ProductResponse para items de lista cursor.
 *
 * @since 1.0.0
 */
export type ProductCursorItemResponse = ProductResponse;

/**
 * Resultado de paginación cursor de productos.
 *
 * @interface CursorPaginatedProductsResult
 * @since 1.0.0
 */
export interface CursorPaginatedProductsResult {
    /** Productos encontrados en esta página. */
    readonly items: ProductCursorItemResponse[];

    /** Cursor para la siguiente página, null si no hay más resultados. */
    readonly nextCursor: string | null;
}
