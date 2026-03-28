/**
 * @fileoverview Response de sincronización Pull de Customer
 * @module SyncPullCustomerResponse
 * @version 1.0.0
 */

import type { CustomerResponse } from './CustomerResponse';

export interface SyncPullCustomerResponse {
    readonly changes: CustomerResponse[];
    readonly lastSyncedAt: Date;
    readonly hasMore: boolean;
}
