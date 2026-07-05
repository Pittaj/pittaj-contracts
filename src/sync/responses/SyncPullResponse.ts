/**
 * @fileoverview Response genérico del sync pull (canónico)
 * @module sync/responses/SyncPullResponse
 * @version 1.0.0
 */

/**
 * Response genérico de POST /api/{plural}/sync/pull.
 *
 * `changes` son DTOs planos de la entidad (shape actual que ya parsea
 * el desktop), NO envelopes SyncChange.
 *
 * `lastSyncedAt` es el checkpoint por página: el `updatedAt` efectivo
 * del último registro devuelto, o la fecha del servidor si no hubo cambios.
 */
export interface SyncPullResponse<T> {
    readonly changes: T[];
    readonly lastSyncedAt: Date;
    readonly hasMore: boolean;
}
