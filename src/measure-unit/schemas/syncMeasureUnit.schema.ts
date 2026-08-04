/**
 * @fileoverview Schemas Zod para sincronización de MeasureUnit
 * @module Contracts/MeasureUnit/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que tax/company/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync/index.js';

/** POST /api/measure-units/sync/push — deriva del canónico src/sync */
export const syncPushMeasureUnitSchema = syncPushRequestSchema;

/** POST /api/measure-units/sync/pull — deriva del canónico src/sync */
export const syncPullMeasureUnitSchema = syncPullRequestSchema;
