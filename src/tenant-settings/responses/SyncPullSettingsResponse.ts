/**
 * @fileoverview Response del sync pull de tenant-settings (canal dedicado).
 * @module Contracts/TenantSettings/Sync
 *
 * Sin hasMore: son decenas de claves, no miles — el pull devuelve todo
 * el delta en una sola respuesta.
 */

/** Setting sincronizable devuelto por el pull. */
export interface SyncPullSettingsEntry {
    readonly key: string;
    readonly value: string;
    /** updated_at del servidor (base LWW del cliente). */
    readonly updatedAt: Date;
}

/** Response de POST /api/tenant-settings/sync/pull. */
export interface SyncPullSettingsResponse {
    readonly entries: SyncPullSettingsEntry[];
    /**
     * Checkpoint: max(updated_at) de las entradas devueltas, o la fecha
     * del servidor si no hubo cambios.
     */
    readonly lastSyncedAt: Date;
}
