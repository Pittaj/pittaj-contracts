/**
 * @fileoverview Response de sincronización Pull de CashClosure
 * @module SyncPullCashClosureResponse
 * @version 1.0.0
 */

import type { CashClosureResponse } from './CashClosureResponse';

export interface SyncPullCashClosureResponse {
    readonly changes: CashClosureResponse[];
    readonly lastSyncedAt: Date;
    readonly hasMore: boolean;
}
