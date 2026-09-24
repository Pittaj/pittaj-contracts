/**
 * @fileoverview Schemas Zod para sincronización de BusinessLine
 * @module Contracts/BusinessLine/Schemas/Sync
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que department. La línea es del tenant, SIN companyId: si el
 * snapshot del desktop trae companyId extra en `data`, el schema canónico
 * lo permite (data es record) y el backend lo ignora.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync/index.js';

/** POST /api/business-lines/sync/push — deriva del canónico src/sync */
export const syncPushBusinessLineSchema = syncPushRequestSchema;

/** POST /api/business-lines/sync/pull — deriva del canónico src/sync */
export const syncPullBusinessLineSchema = syncPullRequestSchema;
