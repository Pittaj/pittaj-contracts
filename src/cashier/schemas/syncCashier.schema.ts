/**
 * @fileoverview Schemas Zod para sincronización de Cashier
 * @module Contracts/Cashier/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que register/promotion/tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/cashiers/sync/push — deriva del canónico src/sync */
export const syncPushCashierSchema = syncPushRequestSchema;

/** POST /api/cashiers/sync/pull — deriva del canónico src/sync */
export const syncPullCashierSchema = syncPullRequestSchema;
