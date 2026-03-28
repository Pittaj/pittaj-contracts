/**
 * @fileoverview Esquema Zod para validación de peticiones de creación de categorías
 * @module Contracts/Category
 * @version 1.0.0
 *
 * Define validaciones de entrada para el endpoint POST /categories.
 *
 * **Arquitectura Child Container DI + PWA:**
 * - tenantId y createdBy vienen de headers HTTP (X-Tenant-ID, X-User-ID)
 * - Servidor SIEMPRE genera código (eliminado campo `code`)
 * - Background Sync envía `id` del cliente cuando sincroniza
 */

import { z } from 'zod';

/**
 * Scopes válidos para categorías.
 *
 * - PRODUCT: Productos físicos
 * - SERVICE: Servicios
 * - EXPENSE: Gastos
 * - ASSET: Activos fijos
 * - GL_ACCOUNT: Cuentas contables
 * - ACCOUNTING: Contabilidad general
 * - PROJECT: Proyectos
 * - PROCUREMENT: Procurement
 * - NAV_POS: Navegación POS
 * - NAV_ECOM: Navegación E-commerce
 */
export const CategoryScopeEnum = z.enum([
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
 * Esquema de validación para crear una categoría.
 *
 * Valida que los datos de entrada cumplan con las reglas de negocio
 * antes de pasar al Handler.
 *
 * @constant
 * @since 1.0.0
 */
export const createCategorySchema = z.object({
    /**
     * ID de la categoría (opcional, UUID v4).
     *
     * **Solo enviar cuando viene de Background Sync** (categoría creada offline).
     * - Online: Cliente NO envía ID, servidor lo genera
     * - Offline → Sync: Cliente envía ID generado localmente
     */
    id: z.string().uuid('El id debe ser un UUID válido').optional(),

    /**
     * Nombre de la categoría (2-100 caracteres).
     */
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no debe exceder 100 caracteres')
        .trim(),

    /**
     * Scope de la categoría.
     */
    scope: CategoryScopeEnum,

    /**
     * ID de la categoría padre (opcional, UUID v4 o null para raíz).
     */
    parentId: z
        .string()
        .uuid('El parentId debe ser un UUID válido')
        .nullable()
        .optional(),

    /**
     * Orden de visualización (opcional, 0-999999).
     */
    displayOrder: z
        .number()
        .int('El orden debe ser un número entero')
        .min(0, 'El orden no puede ser negativo')
        .max(999999, 'El orden no debe exceder 999999')
        .optional(),

    /**
     * Estado inicial de la categoría (opcional, default: ACTIVE).
     */
    status: CategoryStatusEnum.optional(),

    /**
     * Atributos adicionales como metadatos JSON (opcional).
     */
    attributes: z.record(z.unknown()).optional(),

    /**
     * ID del dispositivo/sucursal que creó la categoría (opcional).
     *
     * Usado para tracking multi-sucursal y resolución de conflictos.
     * Formato sugerido: `sucursal-{id}-{device-type}-{index}`
     *
     * @example "sucursal-02-laptop-01", "sucursal-01-tablet-03"
     */
    deviceId: z
        .string()
        .max(255, 'El deviceId no debe exceder 255 caracteres')
        .optional(),
});
