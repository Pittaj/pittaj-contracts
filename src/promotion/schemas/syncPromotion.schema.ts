/**
 * @fileoverview Schemas Zod para sincronización de Promotion
 * @module Contracts/Promotion/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que purchase/price-list/tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/promotions/sync/push — deriva del canónico src/sync */
export const syncPushPromotionSchema = syncPushRequestSchema;

/** POST /api/promotions/sync/pull — deriva del canónico src/sync */
export const syncPullPromotionSchema = syncPullRequestSchema;
