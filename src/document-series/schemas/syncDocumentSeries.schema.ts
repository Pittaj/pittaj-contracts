/**
 * @fileoverview Schemas Zod para sincronización de DocumentSeries
 * @module Contracts/DocumentSeries/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que company/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/document-series/sync/push — deriva del canónico src/sync */
export const syncPushDocumentSeriesSchema = syncPushRequestSchema;

/** POST /api/document-series/sync/pull — deriva del canónico src/sync */
export const syncPullDocumentSeriesSchema = syncPullRequestSchema;
