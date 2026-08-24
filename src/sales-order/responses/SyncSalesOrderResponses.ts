/**
 * @fileoverview Respuestas de sincronización de SalesOrder.
 * @module Contracts/SalesOrder/Responses/Sync
 */

import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';
import type { SalesOrderResponse } from './SalesOrderResponse.js';


/** POST /api/sales-orders/sync/pull */
export type SyncPullSalesOrderResponse = SyncPullResponse<SalesOrderResponse>;

/** POST /api/sales-orders/sync/push */
export type SyncPushSalesOrderResponse = SyncPushResponse;
