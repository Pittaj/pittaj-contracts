/**
 * @fileoverview Schemas Zod para sincronización de Operator.
 * @module Contracts/Operator/Schemas/Sync
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que cashier/register/tax. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/operators/sync/push — deriva del canónico src/sync */
export const syncPushOperatorSchema = syncPushRequestSchema;

/** POST /api/operators/sync/pull — deriva del canónico src/sync */
export const syncPullOperatorSchema = syncPullRequestSchema;
