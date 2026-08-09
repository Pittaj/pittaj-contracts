/**
 * @fileoverview Respuestas de sincronización de SalesOrder.
 * @module Contracts/SalesOrder/Responses/Sync
 */

import type { SyncPullResponse, SyncPushResponse, SyncPushItemResult } from '../../sync/index.js';
import type { SalesOrderResponse } from './SalesOrderResponse.js';

export type { SyncPushItemResult };

/** POST /api/sales-orders/sync/pull */
export type SyncPullSalesOrderResponse = SyncPullResponse<SalesOrderResponse>;

/** POST /api/sales-orders/sync/push */
export type SyncPushSalesOrderResponse = SyncPushResponse;
