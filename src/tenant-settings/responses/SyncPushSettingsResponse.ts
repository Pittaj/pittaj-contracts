/**
 * @fileoverview Response del sync push de tenant-settings (canal dedicado).
 * @module Contracts/TenantSettings/Sync
 */

/**
 * Razón por la que una entrada NO se aplicó:
 * - `stale`: LWW — ya existe un valor con updated_at igual o más reciente.
 * - `key_not_syncable`: la clave está fuera de la allowlist de sync del
 *   servidor (solo prefijos business./ticket./cfdi. viajan).
 */
export type SyncSettingsSkipReason = 'stale' | 'key_not_syncable';

/** Resultado de procesar una entrada individual del push. */
export interface SyncPushSettingsItemResult {
    readonly key: string;
    readonly applied: boolean;
    readonly reason?: SyncSettingsSkipReason;
}

/** Response de POST /api/tenant-settings/sync/push. */
export interface SyncPushSettingsResponse {
    readonly processed: number;
    readonly applied: number;
    readonly skipped: number;
    readonly results: SyncPushSettingsItemResult[];
}
