/**
 * @fileoverview Schemas Zod para sincronización de Tax
 * @module Contracts/Tax/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que company/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/taxes/sync/push — deriva del canónico src/sync */
export const syncPushTaxSchema = syncPushRequestSchema;

/** POST /api/taxes/sync/pull — deriva del canónico src/sync */
export const syncPullTaxSchema = syncPullRequestSchema;
