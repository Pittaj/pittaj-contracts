/**
 * @fileoverview Schemas Zod para sincronización de Inventory (los 3 agregados)
 * @module Contracts/Inventory/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que purchase/tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync/index.js';

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

// ── StockTransfer ────────────────────────────────────────────────────
/** POST /api/stock-transfers/sync/push — deriva del canónico src/sync */
export const syncPushStockTransferSchema = syncPushRequestSchema;
/** POST /api/stock-transfers/sync/pull — deriva del canónico src/sync */
export const syncPullStockTransferSchema = syncPullRequestSchema;

// ── StockAdjustment (ajustes y conteos físicos) ──────────────────────
/** POST /api/stock-adjustments/sync/push — deriva del canónico src/sync */
export const syncPushStockAdjustmentSchema = syncPushRequestSchema;
/** POST /api/stock-adjustments/sync/pull — deriva del canónico src/sync */
export const syncPullStockAdjustmentSchema = syncPullRequestSchema;

// ── Catálogos y documentos nuevos (1.18.0) ───────────────────────────
// Mismo protocolo. Los saldos de lote y el `reserved` NO tienen sync: son proyección.
/** POST /api/stock-levels/sync/{push,pull} — `entityType: 'stock-level'` */
export const syncPushStockLevelSchema = syncPushRequestSchema;
export const syncPullStockLevelSchema = syncPullRequestSchema;
/** POST /api/stock-lots/sync/{push,pull} — `entityType: 'stock-lot'` */
export const syncPushStockLotSchema = syncPushRequestSchema;
export const syncPullStockLotSchema = syncPullRequestSchema;
/** POST /api/stock-reservations/sync/{push,pull} — `entityType: 'stock-reservation'` */
export const syncPushStockReservationSchema = syncPushRequestSchema;
export const syncPullStockReservationSchema = syncPullRequestSchema;
/** POST /api/count-plans/sync/{push,pull} — `entityType: 'count-plan'` */
export const syncPushCountPlanSchema = syncPushRequestSchema;
export const syncPullCountPlanSchema = syncPullRequestSchema;
/** POST /api/label-templates/sync/{push,pull} — `entityType: 'label-template'` */
export const syncPushLabelTemplateSchema = syncPushRequestSchema;
export const syncPullLabelTemplateSchema = syncPullRequestSchema;
/** POST /api/inventory-settings/sync/{push,pull} — `entityType: 'inventory-settings'` */
export const syncPushInventorySettingsSchema = syncPushRequestSchema;
export const syncPullInventorySettingsSchema = syncPullRequestSchema;
