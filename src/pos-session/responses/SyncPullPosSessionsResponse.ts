/**
 * @fileoverview Response de sincronización Pull de PosSession
 * @module SyncPullPosSessionsResponse
 * @version 2.0.0
 */

import type { PosSessionResponse } from './PosSessionResponse';

export interface SyncPullPosSessionsResponse {
    readonly changes: PosSessionResponse[];
    readonly lastSyncedAt: Date;
    readonly hasMore: boolean;
}
