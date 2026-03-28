/**
 * @fileoverview Esquemas Zod para sincronización offline de categorías
 * @module Contracts/Category
 * @version 1.0.0
 *
 * Define validaciones para endpoints de sincronización bidireccional:
 * - syncPush: Enviar cambios locales al servidor
 * - syncPull: Obtener cambios del servidor
 */

import { z } from 'zod';

/**
 * Operaciones de sincronización válidas.
 */
export const SyncOperationEnum = z.enum(['create', 'update', 'delete']);

/**
 * Esquema para un cambio individual en sync push.
 */
export const syncChangeSchema = z.object({
    /**
     * ID de la categoría afectada (UUID v4).
     */
    id: z.string().uuid(),

    /**
     * Tipo de operación realizada offline.
     */
    operation: SyncOperationEnum,

    /**
     * Datos de la categoría (para create/update).
     */
    data: z.unknown(),

    /**
     * Versión del registro (para optimistic locking en update/delete).
     */
    version: z.number().optional(),
});

/**
 * Esquema de validación para push de sincronización.
 *
 * Envía cambios realizados offline al servidor.
 *
 * @constant
 * @since 1.0.0
 */
export const syncPushSchema = z.object({
    /**
     * ID del tenant (UUID v4).
     */
    tenantId: z.string().uuid(),

    /**
     * ID del dispositivo que envía los cambios.
     */
    deviceId: z.string().min(1),

    /**
     * Lista de cambios a sincronizar.
     */
    changes: z.array(syncChangeSchema),
});

/**
 * Esquema de validación para pull de sincronización.
 *
 * Obtiene cambios del servidor desde la última sincronización.
 *
 * @constant
 * @since 1.0.0
 */
export const syncPullSchema = z.object({
    /**
     * ID del tenant (UUID v4).
     */
    tenantId: z.string().uuid(),

    /**
     * Timestamp de la última sincronización (ISO 8601).
     * Si no se proporciona, obtiene todos los registros.
     */
    lastSyncedAt: z.string().datetime().optional(),

    /**
     * Límite de registros a obtener.
     */
    limit: z.number().optional(),

    /**
     * Offset para paginación.
     */
    offset: z.number().optional(),
});
