/**
 * @fileoverview Schemas Zod para sincronización de Layaway.
 * @module Contracts/Layaway/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que sales-return/purchase/pos-ticket. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/layaways/sync/push — deriva del canónico src/sync */
export const syncPushLayawaySchema = syncPushRequestSchema;

/** POST /api/layaways/sync/pull — deriva del canónico src/sync */
export const syncPullLayawaySchema = syncPullRequestSchema;
