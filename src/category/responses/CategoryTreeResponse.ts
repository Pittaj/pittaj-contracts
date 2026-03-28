/**
 * @fileoverview Response DTO para GetCategoryTree query
 * @module queries/get-tree
 * @version 1.0.0
 *
 * Define la estructura de respuesta jerárquica del árbol de categorías.
 * Co-ubicado con la query y handler para cohesión.
 */

/**
 * Response DTO para nodo del árbol de categorías.
 *
 * Estructura recursiva que representa el árbol completo.
 * Cada nodo puede tener hijos anidados.
 *
 * @interface CategoryTreeResponse
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const tree: CategoryTreeResponse = {
 *   id: 'cat-1',
 *   name: 'Electrónica',
 *   children: [
 *     {
 *       id: 'cat-2',
 *       name: 'Smartphones',
 *       children: []
 *     }
 *   ]
 * };
 * ```
 */
export interface CategoryTreeResponse {
    readonly id: string;
    readonly name: string;
    readonly code: string | null;
    readonly displayCode: string;
    readonly scope: string;
    readonly status: string;
    readonly parentId: string | null;
    readonly displayOrder: number;
    readonly path: string;
    readonly level: number;
    readonly hasChildren: boolean;
    readonly childrenCount: number;
    readonly children: CategoryTreeResponse[];
}
