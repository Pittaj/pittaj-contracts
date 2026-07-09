/**
 * @fileoverview Schemas Zod para sincronización de SalesReturn.
 * @module Contracts/SalesReturn/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que purchase/credit-note/pos-ticket. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/sales-returns/sync/push — deriva del canónico src/sync */
export const syncPushSalesReturnSchema = syncPushRequestSchema;

/** POST /api/sales-returns/sync/pull — deriva del canónico src/sync */
export const syncPullSalesReturnSchema = syncPullRequestSchema;
