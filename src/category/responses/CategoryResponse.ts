/**
 * @fileoverview Response DTO para GetCategoryById query
 * @module queries/get-by-id
 * @version 1.0.0
 *
 * Define la estructura de respuesta al consultar una categoría por ID.
 * Co-ubicado con la query y handler para cohesión.
 */

/**
 * Response DTO para consulta de categoría individual.
 *
 * Retorna todos los datos de una categoría incluyendo auditoría.
 *
 * @interface CategoryResponse
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const response: CategoryResponse = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   name: 'Electrónica',
 *   code: 'CAT-0042',
 *   scope: 'PRODUCT',
 *   status: 'ACTIVE'
 * };
 * ```
 */
export interface CategoryResponse {
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
