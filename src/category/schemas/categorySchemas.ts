/**
 * @fileoverview Schemas Zod para validación HTTP del módulo Category
 * @module infrastructure/api/schemas
 * @version 1.0.0
 *
 * Los schemas viven dentro del módulo para máxima cohesión.
 * Migrados desde @pittaj/lib-contracts/category para eliminar dependencia cruzada.
 *
 * @since 1.0.0
 */

import { z } from 'zod';

// ============================================================
// ENUMS compartidos
// ============================================================

/**
 * Scopes válidos para categorías.
 */
export const CategoryScopeZodEnum = z.enum([
    'PRODUCT',
    'SERVICE',
    'EXPENSE',
    'ASSET',
    'GL_ACCOUNT',
    'ACCOUNTING',
    'PROJECT',
    'PROCUREMENT',
    'NAV_POS',
    'NAV_ECOM',
]);

/**
 * Estados válidos para categorías.
 */
export const CategoryStatusEnum = z.enum([
    'ACTIVE',
    'INACTIVE',
    'BLOCKED',
    'ARCHIVED',
]);

/**
 * Operaciones de sincronización válidas.
 */
export const SyncOperationEnum = z.enum(['create', 'update', 'delete']);

// ============================================================
// PARAMS
// ============================================================

/**
 * Validación de parámetro :id en la URL.
 * Mejora de seguridad: valida formato UUID en path params.
 */
export const categoryIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

// ============================================================
// COMMANDS - Schemas de escritura
// ============================================================

/**
 * POST /api/categories
 * Crear una nueva categoría.
 */
export const createCategorySchema = z.object({
    id: z.string().uuid('El id debe ser un UUID válido').optional(),
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no debe exceder 100 caracteres')
        .trim(),
    scope: CategoryScopeZodEnum,
    parentId: z
        .string()
        .uuid('El parentId debe ser un UUID válido')
        .nullable()
        .optional(),
    displayOrder: z
        .number()
        .int('El orden debe ser un número entero')
        .min(0, 'El orden no puede ser negativo')
        .max(999999, 'El orden no debe exceder 999999')
        .optional(),
    status: CategoryStatusEnum.optional(),
    attributes: z.record(z.unknown()).optional(),
    deviceId: z
        .string()
        .max(255, 'El deviceId no debe exceder 255 caracteres')
        .optional(),
});

/**
 * PUT /api/categories/:id
 * Actualizar una categoría existente.
 */
export const updateCategorySchema = z.object({
    scope: CategoryScopeZodEnum,
    version: z
        .number()
        .int('La versión debe ser un número entero')
        .min(0, 'La versión no puede ser negativa'),
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no debe exceder 100 caracteres')
        .trim()
        .optional(),
    code: z
        .string()
        .min(1, 'El código debe tener al menos 1 carácter')
        .max(50, 'El código no debe exceder 50 caracteres')
        .trim()
        .optional(),
    status: CategoryStatusEnum.optional(),
    parentId: z
        .preprocess((val) => {
            if (val === '' || val === undefined || val === 'undefined')
                return null;
            return val;
        }, z.union([z.string().uuid('El parentId debe ser un UUID válido'), z.null()]))
        .optional(),
    displayOrder: z
        .number()
        .int('El orden debe ser un número entero')
        .min(0, 'El orden no puede ser negativo')
        .max(999999, 'El orden no debe exceder 999999')
        .optional(),
    attributes: z.record(z.unknown()).optional(),
});

/**
 * DELETE /api/categories/:id (query params)
 * Eliminar una categoría (soft delete).
 */
export const deleteCategorySchema = z.object({
    scope: CategoryScopeZodEnum,
    version: z.coerce.number().int().positive({
        message: 'La versión debe ser un número entero positivo',
    }),
});

// ============================================================
// QUERIES - Schemas de lectura
// ============================================================

/**
 * GET /api/categories/:id (query params)
 * Obtener una categoría por ID.
 */
export const getCategoryByIdSchema = z.object({
    id: z.string().uuid('El id debe ser un UUID válido'),
    scope: CategoryScopeZodEnum,
});

/**
 * GET /api/categories (query params)
 * Listar categorías con filtros y paginación.
 */
export const getCategoriesSchema = z.object({
    scope: CategoryScopeZodEnum,
    status: CategoryStatusEnum.optional(),
    q: z
        .string()
        .min(1, 'El término de búsqueda debe tener al menos 1 carácter')
        .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
        .optional(),
    parentId: z
        .string()
        .uuid('El parentId debe ser un UUID válido')
        .nullable()
        .optional(),
    page: z
        .string()
        .regex(/^\d+$/, 'La página debe ser un número entero')
        .transform(Number)
        .refine((val) => val >= 1, 'La página debe ser al menos 1')
        .optional()
        .default('1'),
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
    sortBy: z
        .enum(['name', 'code', 'displayOrder', 'createdAt'])
        .optional()
        .default('displayOrder'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * GET /api/categories/tree (query params)
 * Obtener árbol jerárquico de categorías.
 */
export const getCategoryTreeSchema = z.object({
    scope: CategoryScopeZodEnum,
    rootId: z.string().uuid('El rootId debe ser un UUID válido').optional(),
    maxDepth: z
        .string()
        .regex(/^\d+$/, 'La profundidad máxima debe ser un número entero')
        .transform(Number)
        .refine((val) => val >= 1, 'La profundidad máxima debe ser al menos 1')
        .optional(),
});

// ============================================================
// SYNC - Schemas de sincronización
// ============================================================

/**
 * Schema para un cambio individual en sync push.
 */
export const syncChangeSchema = z.object({
    id: z.string().uuid(),
    operation: SyncOperationEnum,
    data: z.unknown(),
    version: z.number().optional(),
});

/**
 * POST /api/categories/sync/push
 * Sincronizar cambios locales al servidor.
 */
export const syncPushSchema = z.object({
    tenantId: z.string().uuid(),
    deviceId: z.string().min(1),
    changes: z.array(syncChangeSchema),
});

/**
 * POST /api/categories/sync/pull
 * Obtener cambios del servidor.
 */
export const syncPullSchema = z.object({
    tenantId: z.string().uuid(),
    lastSyncedAt: z.string().datetime().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
});
