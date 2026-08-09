/**
 * @fileoverview Schemas Zod para sincronización de SalesOrder.
 * @module Contracts/SalesOrder/Schemas/Sync
 *
 * Derivan del protocolo canónico de `src/sync` (fuente única de verdad), igual que credit-note,
 * register, promotion, tax y customer. NO se redefinen aquí: si el sobre del sync cambia, cambia
 * en un sitio.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync/index.js';

/** POST /api/sales-orders/sync/push — deriva del canónico src/sync */
export const syncPushSalesOrderSchema = syncPushRequestSchema;

/** POST /api/sales-orders/sync/pull — deriva del canónico src/sync */
export const syncPullSalesOrderSchema = syncPullRequestSchema;
