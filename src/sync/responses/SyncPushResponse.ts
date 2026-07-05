/**
 * @fileoverview Response genérico del sync push (canónico)
 * @module sync/responses/SyncPushResponse
 * @version 1.0.0
 */

import type { SyncOperation } from '../schemas/syncSchemas';

/** Resultado de procesar un cambio individual. */
export interface SyncPushItemResult {
    readonly id: string;
    readonly success: boolean;
    readonly operation: SyncOperation;
    readonly error?: string;
}

/** Response genérico de POST /api/{plural}/sync/push. */
export interface SyncPushResponse {
    readonly processed: number;
    readonly succeeded: number;
    readonly failed: number;
    readonly results: SyncPushItemResult[];
}
