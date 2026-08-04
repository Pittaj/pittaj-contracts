/**
 * @fileoverview Barrel export para schemas de DocumentSeries.
 * @module Contracts/DocumentSeries
 */

export * from './createDocumentSeries.schema.js';
export * from './documentSeriesIdParam.schema.js';
export * from './getDocumentSeries.schema.js';
export { syncPushDocumentSeriesSchema, syncPullDocumentSeriesSchema } from './syncDocumentSeries.schema.js';
export { assignNextFolioSchema } from './assignNextFolio.schema.js';
export type { AssignNextFolioRequest } from './assignNextFolio.schema.js';
