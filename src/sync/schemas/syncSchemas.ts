/**
 * @fileoverview Schemas Zod canónicos del protocolo de sincronización
 * @module sync/schemas
 * @version 1.0.0
 *
 * Fuente única de verdad para el protocolo sync push/pull por módulo
 * (POST /api/{plural}/sync/push y /sync/pull). Los módulos (customer,
 * payment-method, ...) derivan/reexportan estos schemas en vez de
 * redefinirlos.
 */

import { z } from 'zod';

/** Operaciones soportadas por el protocolo de sincronización. */
export const syncOperationEnum = z.enum(['create', 'update', 'delete', 'upsert']);

/**
 * Cambio individual de sincronización (canónico).
 *
 * Representa una mutación local pendiente de aplicar en el servidor.
 */
export const syncChangeSchema = z.object({
    /** ID de la entidad afectada */
    id: z.string().uuid(),
    /** Tipo de entidad (customer, payment-method, ...) */
    entityType: z.string().min(1),
    /** Operación realizada */
    operation: syncOperationEnum,
    /** Snapshot de la entidad (create/update/upsert) */
    data: z.record(z.unknown()).optional(),
    /** Versión de la entidad (OCC) */
    version: z.number().int(),
    /** Timestamp del cambio en el dispositivo */
    localTimestamp: z.coerce.date(),
    /** ID del dispositivo que originó el cambio */
    deviceId: z.string().optional(),
    /** ID del tenant */
    tenantId: z.string().uuid(),
});

/** POST /api/{plural}/sync/push — request canónico */
export const syncPushRequestSchema = z.object({
    tenantId: z.string().uuid(),
    deviceId: z.string().min(1),
    changes: z.array(syncChangeSchema).min(1),
});

/**
 * POST /api/{plural}/sync/pull — request canónico.
 *
 * - `lastSyncedAt` ausente → pull inicial (todo el tenant, paginado)
 * - `lastSyncedAt` presente → delta (solo cambios posteriores)
 * - `limit`/`offset` → paginación por página; el cliente avanza con
 *   `offset` o re-consulta con el `lastSyncedAt` devuelto por página.
 */
export const syncPullRequestSchema = z.object({
    tenantId: z.string().uuid(),
    lastSyncedAt: z.coerce.date().optional(),
    limit: z.number().int().min(1).max(500).default(100),
    offset: z.number().int().min(0).default(0),
});

// ============================================================
// Tipos inferidos
// ============================================================

export type SyncOperation = z.infer<typeof syncOperationEnum>;
export type SyncChange = z.infer<typeof syncChangeSchema>;
export type SyncPushRequest = z.infer<typeof syncPushRequestSchema>;
export type SyncPullRequest = z.infer<typeof syncPullRequestSchema>;
