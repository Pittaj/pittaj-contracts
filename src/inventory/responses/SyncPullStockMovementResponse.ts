/**
 * @fileoverview Response de sincronización Pull de StockMovement
 * @module Contracts/Inventory/Responses/SyncPullStockMovementResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de StockMovement (shape que ya parsea el desktop).
 */

import type { StockMovementResponse } from './StockMovementResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullStockMovementResponse = SyncPullResponse<StockMovementResponse>;
