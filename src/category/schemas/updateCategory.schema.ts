/**
 * @fileoverview Esquema Zod para validación de peticiones de actualización de categorías
 * @module Contracts/Category
 * @version 1.0.0
 *
 * Define validaciones de entrada para el endpoint PUT /categories/:id.
 * Incluye validación de optimistic locking con campo version.
 * Arquitectura Child Container DI: tenantId y updatedBy vienen de headers HTTP.
 */

import { z } from 'zod';
import { CategoryScopeEnum, CategoryStatusEnum } from './createCategory.schema';

/**
 * Esquema de validación para actualizar una categoría.
 *
 * Valida que los datos de entrada cumplan con las reglas de negocio
 * antes de pasar al UpdateCategoryHandler.
 *
 * NOTA: Todos los campos son opcionales excepto scope y version.
 * Solo se actualizan los campos proporcionados.
 *
 * NOTA: tenantId viene del header X-Tenant-ID, NO del body.
 * NOTA: updatedBy viene del header X-User-ID, NO del body.
 *
 * @constant
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // Actualizar solo nombre y código
 * PUT /categories/550e8400-e29b-41d4-a716-446655440000
 * Headers: { "X-Tenant-ID": "59afae4e...", "X-User-ID": "user-123" }
 * Body: {
 *   "scope": "PRODUCT",
 *   "name": "Electrónica Actualizada",
 *   "code": "CAT-0001-NEW",
 *   "version": 1
 * }
 * ```
 */
export const updateCategorySchema = z.object({
    /**
     * Scope de la categoría (requerido para validación de seguridad y permisos).
     */
    scope: CategoryScopeEnum,

    /**
     * Versión actual de la categoría (optimistic locking).
     * Requerido para prevenir conflictos de concurrencia.
     *
     * El servidor valida que la versión enviada coincida con la versión actual en DB.
     * Si no coincide, retorna error 409 Conflict.
     */
    version: z
        .number()
        .int('La versión debe ser un número entero')
        .min(0, 'La versión no puede ser negativa'),

    /**
     * Nuevo nombre de la categoría (opcional, 2-100 caracteres).
     */
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no debe exceder 100 caracteres')
        .trim()
        .optional(),

    /**
     * Nuevo código de la categoría (opcional, 1-50 caracteres).
     */
    code: z
        .string()
        .min(1, 'El código debe tener al menos 1 carácter')
        .max(50, 'El código no debe exceder 50 caracteres')
        .trim()
        .optional(),

    /**
     * Nuevo estado de la categoría (opcional).
     */
    status: CategoryStatusEnum.optional(),

    /**
     * Nuevo ID de la categoría padre (opcional, UUID v4 o null para convertir en raíz).
     *
     * VALIDACIONES:
     * - Si se proporciona un UUID, el padre debe existir
     * - Si se proporciona null, la categoría se convierte en raíz
     * - No se permite crear referencias circulares (A → B → A)
     * - No se permite asignar como padre a sí misma
     * - No se permite asignar un descendiente como padre
     */
    parentId: z
        .preprocess((val) => {
            // Normalizar valores problemáticos enviados por algunos navegadores
            if (val === '' || val === undefined || val === 'undefined')
                return null;
            // Pasar valores válidos sin cambios (UUID string o null)
            return val;
        }, z.union([z.string().uuid('El parentId debe ser un UUID válido'), z.null()]))
        .optional(),

    /**
     * Nuevo orden de visualización (opcional, 0-999999).
     */
    displayOrder: z
        .number()
        .int('El orden debe ser un número entero')
        .min(0, 'El orden no puede ser negativo')
        .max(999999, 'El orden no debe exceder 999999')
        .optional(),

    /**
     * Nuevos atributos adicionales como metadatos JSON (opcional).
     *
     * NOTA: Los atributos se actualizan completamente (no se mezclan con los existentes).
     * Para agregar un atributo, se debe enviar el objeto completo con todos los atributos.
     */
    attributes: z.record(z.unknown()).optional(),
});
