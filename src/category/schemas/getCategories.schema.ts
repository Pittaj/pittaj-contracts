/**
 * @fileoverview Esquema Zod para validación de petición GET /categories
 * @module Contracts/Category
 * @version 1.0.0
 *
 * Define validaciones para listar categorías con filtros y paginación.
 *
 * **Child Container DI:**
 * - tenantId viene del header X-Tenant-ID (no query param)
 */

import { z } from 'zod';
import { CategoryScopeEnum, CategoryStatusEnum } from './createCategory.schema';

/**
 * Esquema de validación para listar categorías.
 *
 * Soporta filtros (scope, status, parentId), paginación y ordenamiento.
 *
 * @constant
 * @since 1.0.0
 */
export const getCategoriesSchema = z.object({
    /**
     * Scope de categorías a filtrar (requerido por seguridad).
     * Cada usuario solo debe poder consultar los scopes a los que tiene acceso.
     */
    scope: CategoryScopeEnum,

    /**
     * Estado de categorías a filtrar (opcional).
     */
    status: CategoryStatusEnum.optional(),

    /**
     * Texto de búsqueda (opcional).
     * Busca en nombre y código de categoría.
     */
    q: z
        .string()
        .min(1, 'El término de búsqueda debe tener al menos 1 carácter')
        .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
        .optional(),

    /**
     * ID del padre para filtrar categorías hijas (opcional).
     * null = obtener solo raíces.
     * undefined = sin filtro de padre.
     */
    parentId: z
        .string()
        .uuid('El parentId debe ser un UUID válido')
        .nullable()
        .optional(),

    /**
     * Número de página (opcional, default: 1).
     */
    page: z
        .string()
        .regex(/^\d+$/, 'La página debe ser un número entero')
        .transform(Number)
        .refine((val) => val >= 1, 'La página debe ser al menos 1')
        .optional()
        .default('1'),

    /**
     * Tamaño de página (opcional, default: 50, max: 100).
     */
    pageSize: z
        .string()
        .regex(/^\d+$/, 'El tamaño de página debe ser un número entero')
        .transform(Number)
        .refine(
            (val) => val >= 1 && val <= 100,
            'El tamaño de página debe estar entre 1 y 100'
        )
        .optional()
        .default('50'),

    /**
     * Campo por el cual ordenar (opcional, default: displayOrder).
     */
    sortBy: z
        .enum(['name', 'code', 'displayOrder', 'createdAt'])
        .optional()
        .default('displayOrder'),

    /**
     * Dirección del ordenamiento (opcional, default: asc).
     */
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
