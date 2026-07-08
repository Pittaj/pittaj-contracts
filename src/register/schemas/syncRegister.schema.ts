/**
 * @fileoverview Schemas Zod para sincronización de Register
 * @module Contracts/Register/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que promotion/purchase/price-list/tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/registers/sync/push — deriva del canónico src/sync */
export const syncPushRegisterSchema = syncPushRequestSchema;

/** POST /api/registers/sync/pull — deriva del canónico src/sync */
export const syncPullRegisterSchema = syncPullRequestSchema;
