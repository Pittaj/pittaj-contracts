/**
 * @fileoverview Schemas Zod para sincronización de PriceList
 * @module Contracts/PriceList/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/price-lists/sync/push — deriva del canónico src/sync */
export const syncPushPriceListSchema = syncPushRequestSchema;

/** POST /api/price-lists/sync/pull — deriva del canónico src/sync */
export const syncPullPriceListSchema = syncPullRequestSchema;
