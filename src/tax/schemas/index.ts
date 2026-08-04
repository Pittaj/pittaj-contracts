/**
 * @fileoverview Barrel export para schemas de Tax.
 * @module Contracts/Tax
 */

export * from './createTax.schema.js';
export * from './taxIdParam.schema.js';
export * from './getTaxes.schema.js';
export { syncPushTaxSchema, syncPullTaxSchema } from './syncTax.schema.js';
