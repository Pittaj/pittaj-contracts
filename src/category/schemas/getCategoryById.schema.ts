/**
 * @fileoverview Esquema Zod para validación de petición GET /categories/:id
 * @module Contracts/Category
 * @version 1.0.0
 *
 * Define validaciones para obtener una categoría por ID.
 * Arquitectura Child Container DI: tenantId viene del header X-Tenant-ID (no query param).
 */

import { z } from 'zod';
import { CategoryScopeEnum } from './createCategory.schema';

/**
 * Esquema de validación para obtener categoría por ID.
 *
 * Valida parámetros de ruta y query params.
 *
 * NOTA: tenantId viene del header X-Tenant-ID, NO se valida aquí.
 *
 * @constant
 * @since 1.0.0
 */
export const getCategoryByIdSchema = z.object({
    /**
     * ID de la categoría a obtener (UUID v4).
     */
    id: z.string().uuid('El id debe ser un UUID válido'),

    /**
     * Scope de la categoría (requerido por seguridad).
     * Valida que el usuario tenga acceso al scope de la categoría solicitada.
     */
    scope: CategoryScopeEnum,
});
