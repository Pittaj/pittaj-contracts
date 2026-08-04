/**
 * @fileoverview Response del comando SyncPush de Supplier
 * @module Contracts/Supplier/Responses/SyncPushSupplierResponse
 * @version 1.0.0
 *
 * Deriva del response genérico canónico de src/sync.
 */

import type { SyncPushResponse, SyncPushItemResult } from '../../sync/index.js';

export type { SyncPushItemResult };

export type SyncPushSupplierResponse = SyncPushResponse;
