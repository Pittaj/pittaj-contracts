/**
 * @fileoverview Schemas Zod para sincronización de Company
 * @module Contracts/Company/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/companies/sync/push — deriva del canónico src/sync */
export const syncPushCompanySchema = syncPushRequestSchema;

/** POST /api/companies/sync/pull — deriva del canónico src/sync */
export const syncPullCompanySchema = syncPullRequestSchema;
