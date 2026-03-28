/**
 * @fileoverview Response DTO para GetProducts query
 * @module queries/get-products
 * @version 1.0.0
 *
 * Define la estructura de respuesta al listar productos.
 * Idéntico a ProductResponse para consistencia.
 */

import type { ProductResponse } from './ProductResponse';

/**
 * Response DTO para item de lista de productos.
 *
 * Idéntico a ProductResponse. Se mantiene como type alias
 * para cohesión con el patrón Category.
 *
 * @since 1.0.0
 */
export type ProductListResponse = ProductResponse;
