/**
 * @fileoverview Response del comando SyncPush de PaymentMethod
 * @module SyncPushPaymentMethodResponse
 * @version 2.0.0
 *
 * Deriva del response genérico canónico de src/sync (compat: se
 * conservan los nombres exportados existentes).
 */

import type { SyncPushResponse, SyncPushItemResult } from '../../sync';

export type { SyncPushItemResult };

export type SyncPushPaymentMethodResponse = SyncPushResponse;
