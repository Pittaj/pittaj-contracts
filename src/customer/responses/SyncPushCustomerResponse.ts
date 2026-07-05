/**
 * @fileoverview Response del comando SyncPush de Customer
 * @module SyncPushCustomerResponse
 * @version 2.0.0
 *
 * Deriva del response genérico canónico de src/sync (compat: se
 * conservan los nombres exportados existentes).
 */

import type { SyncPushResponse, SyncPushItemResult } from '../../sync';

export type { SyncPushItemResult };

export type SyncPushCustomerResponse = SyncPushResponse;
