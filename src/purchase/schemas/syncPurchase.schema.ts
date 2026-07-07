/**
 * @fileoverview Schemas Zod para sincronización de Purchase
 * @module Contracts/Purchase/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que price-list/tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/purchases/sync/push — deriva del canónico src/sync */
export const syncPushPurchaseSchema = syncPushRequestSchema;

/** POST /api/purchases/sync/pull — deriva del canónico src/sync */
export const syncPullPurchaseSchema = syncPullRequestSchema;
