/**
 * @fileoverview Barrel export para responses de Supplier.
 * @module Contracts/Supplier
 */

export type { SupplierResponse } from './SupplierResponse.js';
export type { CreateSupplierResponse } from './CreateSupplierResponse.js';
export type { UpdateSupplierResponse } from './UpdateSupplierResponse.js';
export type { GetSuppliersResponse } from './GetSuppliersResponse.js';
export type {
    SyncPushSupplierResponse,
    SyncPushItemResult,
} from './SyncPushSupplierResponse.js';
export type { SyncPullSupplierResponse } from './SyncPullSupplierResponse.js';
