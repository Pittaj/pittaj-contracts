/**
 * @fileoverview Schemas Zod para sincronización de Inventory (los 3 agregados)
 * @module Contracts/Inventory/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que purchase/tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

// ── Warehouse ────────────────────────────────────────────────────────
/** POST /api/warehouses/sync/push — deriva del canónico src/sync */
export const syncPushWarehouseSchema = syncPushRequestSchema;
/** POST /api/warehouses/sync/pull — deriva del canónico src/sync */
export const syncPullWarehouseSchema = syncPullRequestSchema;

// ── StockItem ────────────────────────────────────────────────────────
/** POST /api/stock-items/sync/push — deriva del canónico src/sync */
export const syncPushStockItemSchema = syncPushRequestSchema;
/** POST /api/stock-items/sync/pull — deriva del canónico src/sync */
export const syncPullStockItemSchema = syncPullRequestSchema;

// ── StockMovement ────────────────────────────────────────────────────
/** POST /api/stock-movements/sync/push — deriva del canónico src/sync */
export const syncPushStockMovementSchema = syncPushRequestSchema;
/** POST /api/stock-movements/sync/pull — deriva del canónico src/sync */
export const syncPullStockMovementSchema = syncPullRequestSchema;
