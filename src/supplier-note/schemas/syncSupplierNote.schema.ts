/**
 * @fileoverview Schemas Zod del sync de notas a proveedor.
 * @module Contracts/SupplierNote/Schemas
 *
 * Derivan del protocolo canónico de src/sync. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/supplier-notes/sync/push */
export const syncPushSupplierNoteSchema = syncPushRequestSchema;
/** POST /api/supplier-notes/sync/pull */
export const syncPullSupplierNoteSchema = syncPullRequestSchema;

/** POST /api/supplier-product-links/sync/push */
export const syncPushSupplierProductLinkSchema = syncPushRequestSchema;
/** POST /api/supplier-product-links/sync/pull */
export const syncPullSupplierProductLinkSchema = syncPullRequestSchema;
