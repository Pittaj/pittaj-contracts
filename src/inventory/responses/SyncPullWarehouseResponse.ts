/**
 * @fileoverview Response de sincronización Pull de Warehouse
 * @module Contracts/Inventory/Responses/SyncPullWarehouseResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Warehouse (shape que ya parsea el desktop).
 */

import type { WarehouseResponse } from './WarehouseResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullWarehouseResponse = SyncPullResponse<WarehouseResponse>;
