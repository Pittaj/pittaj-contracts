/**
 * @fileoverview Response de sincronización Pull de PaymentMethod
 * @module SyncPullPaymentMethodResponse
 * @version 1.0.0
 */

import type { PaymentMethodResponse } from './PaymentMethodResponse';

export interface SyncPullPaymentMethodResponse {
    readonly changes: PaymentMethodResponse[];
    readonly lastSyncedAt: Date;
    readonly hasMore: boolean;
}
