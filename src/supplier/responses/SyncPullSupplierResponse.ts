/**
 * @fileoverview Response de sincronización Pull de Supplier
 * @module Contracts/Supplier/Responses/SyncPullSupplierResponse
 * @version 1.0.0
 *
 * Deriva del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Supplier (shape que parsea el desktop).
 */

import type { SupplierResponse } from './SupplierResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullSupplierResponse = SyncPullResponse<SupplierResponse>;
