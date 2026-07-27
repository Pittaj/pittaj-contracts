/**
 * @fileoverview Barrel export para responses de Supplier.
 * @module Contracts/Supplier
 */

export type { SupplierResponse } from './SupplierResponse';
export type { CreateSupplierResponse } from './CreateSupplierResponse';
export type { UpdateSupplierResponse } from './UpdateSupplierResponse';
export type { GetSuppliersResponse } from './GetSuppliersResponse';
export type {
    SyncPushSupplierResponse,
    SyncPushItemResult,
} from './SyncPushSupplierResponse';
export type { SyncPullSupplierResponse } from './SyncPullSupplierResponse';
