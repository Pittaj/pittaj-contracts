/**
 * @fileoverview Responses de sync de notas a proveedor (alias del canónico de src/sync).
 * @module Contracts/SupplierNote/Responses
 */

import type { SupplierNoteResponse, SupplierProductLinkResponse } from './SupplierNoteResponse';
import type { SyncPullResponse, SyncPushResponse, SyncPushItemResult } from '../../sync';

export type { SyncPushItemResult };

export type SyncPushSupplierNoteResponse = SyncPushResponse;
export type SyncPullSupplierNoteResponse = SyncPullResponse<SupplierNoteResponse>;

export type SyncPushSupplierProductLinkResponse = SyncPushResponse;
export type SyncPullSupplierProductLinkResponse = SyncPullResponse<SupplierProductLinkResponse>;
