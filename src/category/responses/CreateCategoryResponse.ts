/**
 * @fileoverview Response DTO para CreateCategory command
 * @module commands/create-category
 * @version 1.0.0
 *
 * Define la estructura de respuesta después de crear una categoría.
 * Co-ubicado con el command y handler para cohesión.
 */

/**
 * Response DTO para categoría creada.
 *
 * Retorna información esencial después de crear una categoría.
 * Evita que el cliente tenga que hacer segunda query.
 *
 * @interface CreateCategoryResponse
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const response: CreateCategoryResponse = {
 *   id: 'cat-123',
 *   code: 'CAT-0042',
 *   displayCode: 'CAT-0042',
 *   name: 'Electrónica',
 *   scope: 'PRODUCT',
 *   status: 'ACTIVE',
 *   parentId: null,
 *   tenantId: 'tenant-123',
 *   createdAt: new Date(),
 *   createdBy: 'user-456'
 * };
 * ```
 */
export interface CreateCategoryResponse {
    /**
     * ID único de la categoría.
     */
    readonly id: string;

    /**
     * Código definitivo (null si es offline).
     */
    readonly code: string | null;

    /**
     * Código para mostrar en UI (temporal o definitivo).
     */
    readonly displayCode: string;

    /**
     * Nombre de la categoría.
     */
    readonly name: string;

    /**
     * Alcance de la categoría.
     */
    readonly scope: string;

    /**
     * Estado de la categoría.
     */
    readonly status: string;

    /**
     * ID de la categoría padre (null si es raíz).
     */
    readonly parentId: string | null;

    /**
     * ID del tenant propietario.
     */
    readonly tenantId: string;

    /**
     * Orden de visualización.
     */
    readonly displayOrder: number;

    /**
     * Path jerárquico.
     */
    readonly path: string;

    /**
     * Nivel en el árbol (0 = raíz).
     */
    readonly level: number;

    /**
     * Atributos adicionales.
     */
    readonly attributes: Record<string, any> | null;

    /**
     * Timestamp de creación.
     */
    readonly createdAt: Date;

    /**
     * Usuario que creó.
     */
    readonly createdBy: string;
}
