/**
 * @fileoverview Response DTO para UpdateCategory command
 * @module commands/update-category
 * @version 1.0.0
 *
 * Define la estructura de respuesta después de actualizar una categoría.
 * Co-ubicado con el command y handler para cohesión.
 */

/**
 * Response DTO para categoría actualizada.
 *
 * Retorna la categoría completa después de actualizar.
 * Incluye campos de auditoría para tracking de cambios.
 *
 * @interface UpdateCategoryResponse
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const response: UpdateCategoryResponse = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   name: 'Electrónica Actualizada',
 *   version: 2,
 *   updatedAt: new Date(),
 *   updatedBy: 'user-789'
 * };
 * ```
 */
export interface UpdateCategoryResponse {
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
