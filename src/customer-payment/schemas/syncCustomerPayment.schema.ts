/**
 * @fileoverview Schemas Zod para sincronización de CustomerPayment.
 * @module Contracts/CustomerPayment/Schemas/Sync
 *
 * Derivan del protocolo canónico de `src/sync` (fuente única de verdad). NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync/index.js';

/** POST /api/customer-payments/sync/push — deriva del canónico src/sync */
export const syncPushCustomerPaymentSchema = syncPushRequestSchema;

/** POST /api/customer-payments/sync/pull — deriva del canónico src/sync */
export const syncPullCustomerPaymentSchema = syncPullRequestSchema;
