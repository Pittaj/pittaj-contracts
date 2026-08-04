import type { ProductListResponse } from './ProductListResponse.js';

/** Resultado paginado de productos. */
export interface PaginatedProductsResult {
    readonly items: ProductListResponse[];
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
}
