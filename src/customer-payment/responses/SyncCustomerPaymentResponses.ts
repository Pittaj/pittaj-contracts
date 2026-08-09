/**
 * @fileoverview Respuestas de sincronización de CustomerPayment.
 * @module Contracts/CustomerPayment/Responses/Sync
 */

import type { SyncPullResponse, SyncPushResponse, SyncPushItemResult } from '../../sync/index.js';
import type { CustomerPaymentResponse } from './CustomerPaymentResponse.js';

export type { SyncPushItemResult };

/** POST /api/customer-payments/sync/pull */
export type SyncPullCustomerPaymentResponse = SyncPullResponse<CustomerPaymentResponse>;

/** POST /api/customer-payments/sync/push */
export type SyncPushCustomerPaymentResponse = SyncPushResponse;
