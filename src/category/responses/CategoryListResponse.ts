/**
 * @fileoverview Response DTO para GetCategories query
 * @module queries/get-categories
 * @version 1.0.0
 *
 * Define la estructura de respuesta al listar categorías.
 * Co-ubicado con la query y handler para cohesión.
 */

/**
 * Response DTO para item de lista de categorías.
 *
 * Similar a CategoryResponse pero optimizado para listados.
 * Puede excluir campos pesados si es necesario.
 *
 * @interface CategoryListResponse
 * @since 1.0.0
 */
export interface CategoryListResponse {
    readonly id: string;
    readonly name: string;
    readonly code: string | null;
    readonly displayCode: string;
    readonly scope: string;
    readonly status: string;
    readonly tenantId: string;
    readonly parentId: string | null;
    readonly displayOrder: number;
    readonly attributes: Record<string, any> | null;
    readonly path: string;
    readonly level: number;
    readonly createdAt: Date;
    readonly createdBy: string | null;
    readonly updatedAt: Date | null;
    readonly updatedBy: string | null;
    readonly version: number;
}
