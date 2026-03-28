/**
 * @fileoverview Response del comando SyncPush de CashClosure
 * @module SyncPushCashClosureResponse
 * @version 1.0.0
 */

export interface SyncPushItemResult {
    readonly id: string;
    readonly success: boolean;
    readonly operation: 'create' | 'update' | 'delete' | 'upsert';
    readonly error?: string;
}

export interface SyncPushCashClosureResponse {
    readonly processed: number;
    readonly succeeded: number;
    readonly failed: number;
    readonly results: SyncPushItemResult[];
}
