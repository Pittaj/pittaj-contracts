/**
 * @fileoverview Esquema Zod para validación de petición GET /categories/tree
 * @module Contracts/Category
 * @version 1.0.0
 *
 * Define validaciones para obtener árbol jerárquico de categorías.
 * Arquitectura Child Container DI: tenantId viene del header X-Tenant-ID (no query param).
 */

import { z } from 'zod';
import { CategoryScopeEnum } from './createCategory.schema';

/**
 * Esquema de validación para obtener árbol de categorías.
 *
 * Permite especificar scope, raíz y profundidad máxima.
 *
 * NOTA: tenantId viene del header X-Tenant-ID, NO se valida aquí.
 *
 * @constant
 * @since 1.0.0
 */
export const getCategoryTreeSchema = z.object({
    /**
     * Scope del árbol de categorías (requerido).
     */
    scope: CategoryScopeEnum,

    /**
     * ID de la categoría raíz para construir subárbol (opcional).
     * Si no se proporciona, se obtienen todas las raíces del scope.
     */
    rootId: z.string().uuid('El rootId debe ser un UUID válido').optional(),

    /**
     * Profundidad máxima del árbol (opcional, default: sin límite).
     * 1 = solo raíces, 2 = raíces + hijos directos, etc.
     */
    maxDepth: z
        .string()
        .regex(/^\d+$/, 'La profundidad máxima debe ser un número entero')
        .transform(Number)
        .refine((val) => val >= 1, 'La profundidad máxima debe ser al menos 1')
        .optional(),
});
