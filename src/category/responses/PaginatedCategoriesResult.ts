import type { CategoryListResponse } from './CategoryListResponse';

/** Resultado paginado de categorías. */
export interface PaginatedCategoriesResult {
    readonly items: CategoryListResponse[];
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
}
