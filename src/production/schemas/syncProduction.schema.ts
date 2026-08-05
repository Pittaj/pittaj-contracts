/**
 * @fileoverview Schemas Zod del sync de Producción.
 * @module Contracts/Production/Schemas
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad). NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/recipes/sync/push */
export const syncPushRecipeSchema = syncPushRequestSchema;
/** POST /api/recipes/sync/pull */
export const syncPullRecipeSchema = syncPullRequestSchema;

/** POST /api/production-orders/sync/push */
export const syncPushProductionOrderSchema = syncPushRequestSchema;
/** POST /api/production-orders/sync/pull */
export const syncPullProductionOrderSchema = syncPullRequestSchema;
