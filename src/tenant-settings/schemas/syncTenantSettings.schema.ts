/**
 * @fileoverview Schemas Zod para el canal DEDICADO de sync de tenant-settings.
 *
 * Los settings NO caben en el protocolo genérico de src/sync (syncChangeSchema
 * exige id uuid + version; los settings son PK compuesta (tenant_id, key)
 * sin versión). Canal propio más simple: LWW (last-write-wins) por clave
 * comparando updatedAt.
 *
 * @module Contracts/TenantSettings/Sync
 */

import { z } from 'zod';

/** Formato de clave: minúsculas, dígitos, punto, guion y guion bajo. */
const KEY_REGEX = /^[a-z0-9._-]+$/;

const ERROR_MESSAGES = {
    KEY_INVALID: 'Clave inválida: use minúsculas, dígitos, punto, guion o guion bajo',
    KEY_TOO_LONG: 'La clave no puede exceder 100 caracteres',
    VALUE_TOO_LONG: 'El valor no puede exceder 500 caracteres',
    ENTRIES_EMPTY: 'entries debe tener al menos 1 elemento',
    TOO_MANY_ENTRIES: 'Máximo 100 entries por push',
} as const;

/**
 * Entrada individual de sync: snapshot de un setting con su timestamp
 * local (base de la comparación LWW en el servidor).
 */
export const syncSettingsEntrySchema = z.object({
    /** Clave del setting, ej. "cfdi.issuer.rfc". */
    key: z
        .string()
        .max(100, { message: ERROR_MESSAGES.KEY_TOO_LONG })
        .regex(KEY_REGEX, { message: ERROR_MESSAGES.KEY_INVALID }),
    /** Valor serializado como texto. */
    value: z.string().max(500, { message: ERROR_MESSAGES.VALUE_TOO_LONG }),
    /** Timestamp de la última modificación local (LWW). */
    updatedAt: z.coerce.date(),
});

/** POST /api/tenant-settings/sync/push — request. */
export const syncPushSettingsSchema = z.object({
    tenantId: z.string().uuid(),
    deviceId: z.string().min(1),
    entries: z
        .array(syncSettingsEntrySchema)
        .min(1, { message: ERROR_MESSAGES.ENTRIES_EMPTY })
        .max(100, { message: ERROR_MESSAGES.TOO_MANY_ENTRIES }),
});

/**
 * POST /api/tenant-settings/sync/pull — request.
 *
 * - `lastSyncedAt` ausente → pull inicial (todas las claves sincronizables)
 * - `lastSyncedAt` presente → delta (solo claves con updated_at posterior)
 *
 * Sin paginación: son decenas de claves, no miles.
 */
export const syncPullSettingsSchema = z.object({
    tenantId: z.string().uuid(),
    lastSyncedAt: z.coerce.date().optional(),
});

// ============================================================
// Tipos inferidos
// ============================================================

export type SyncSettingsEntry = z.infer<typeof syncSettingsEntrySchema>;
export type SyncPushSettingsRequest = z.infer<typeof syncPushSettingsSchema>;
export type SyncPullSettingsRequest = z.infer<typeof syncPullSettingsSchema>;
