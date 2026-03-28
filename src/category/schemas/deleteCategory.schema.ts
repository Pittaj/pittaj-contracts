/**
 * @fileoverview Esquema Zod para validación de peticiones de eliminación de categorías
 * @module Contracts/Category
 * @version 1.0.0
 *
 * Define validaciones de entrada para el endpoint DELETE /categories/:id.
 * El endpoint usa soft delete (marca como ARCHIVED en vez de eliminar físicamente).
 * Arquitectura Child Container DI: tenantId y deletedBy vienen de headers HTTP.
 */

import { z } from 'zod';
import { CategoryScopeEnum } from './createCategory.schema';

/**
 * Esquema de validación para eliminar una categoría (query params).
 *
 * Valida parámetros de seguridad multi-tenant antes de ejecutar soft delete.
 * El ID de la categoría viene en el path parameter (:id), no en el body.
 *
 * NOTA: Este endpoint implementa soft delete. La categoría NO se elimina físicamente
 * de la base de datos, sino que se marca con estado ARCHIVED.
 *
 * NOTA: tenantId viene del header X-Tenant-ID, NO del query.
 * NOTA: deletedBy viene del header X-User-ID, NO del query.
 *
 * @constant
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // Eliminar categoría (requiere version para optimistic locking)
 * DELETE /categories/550e8400-e29b-41d4-a716-446655440000?scope=PRODUCT&version=2
 * Headers: { "X-Tenant-ID": "59afae4e...", "X-User-ID": "user-123" }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Category deleted successfully",
 *   "data": null
 * }
 * ```
 */
export const deleteCategorySchema = z.object({
    /**
     * Scope de la categoría (requerido para validación de seguridad y permisos).
     */
    scope: CategoryScopeEnum,

    /**
     * Versión actual de la categoría.
     * Requerido para optimistic concurrency control (previene race conditions).
     */
    version: z.coerce.number().int().positive({
        message: 'La versión debe ser un número entero positivo',
    }),
});
