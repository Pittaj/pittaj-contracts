/**
 * @fileoverview Schemas Zod para sincronización de Location
 * @module Contracts/Location/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/locations/sync/push — deriva del canónico src/sync */
export const syncPushLocationSchema = syncPushRequestSchema;

/** POST /api/locations/sync/pull — deriva del canónico src/sync */
export const syncPullLocationSchema = syncPullRequestSchema;
