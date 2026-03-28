/**
 * @fileoverview Response del comando SyncPush de PosSession
 * @module SyncPushPosSessionResponse
 * @version 1.0.0
 */

export interface SyncPushItemResult {
    readonly id: string;
    readonly success: boolean;
    readonly operation: 'create' | 'update' | 'delete' | 'upsert';
    readonly error?: string;
}

export interface SyncPushPosSessionResponse {
    readonly processed: number;
    readonly succeeded: number;
    readonly failed: number;
    readonly results: SyncPushItemResult[];
}
