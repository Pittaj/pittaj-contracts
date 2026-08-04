/**
 * @fileoverview Response de sincronización Pull de StockItem
 * @module Contracts/Inventory/Responses/SyncPullStockItemResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de StockItem (shape que ya parsea el desktop).
 */

import type { StockItemResponse } from './StockItemResponse.js';
import type { SyncPullResponse } from '../../sync/index.js';

export type SyncPullStockItemResponse = SyncPullResponse<StockItemResponse>;
