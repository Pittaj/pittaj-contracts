/**
 * @fileoverview Schemas Zod para sincronización de ReceivedCfdi.
 * @module Contracts/ReceivedCfdi/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que purchase/tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync/index.js';

/** POST /api/received-cfdis/sync/push — deriva del canónico src/sync */
export const syncPushReceivedCfdiSchema = syncPushRequestSchema;

/** POST /api/received-cfdis/sync/pull — deriva del canónico src/sync */
export const syncPullReceivedCfdiSchema = syncPullRequestSchema;
