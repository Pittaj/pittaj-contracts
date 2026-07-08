/**
 * @fileoverview Barrel export para schemas de DocumentSeries.
 * @module Contracts/DocumentSeries
 */

export * from './createDocumentSeries.schema';
export * from './documentSeriesIdParam.schema';
export * from './getDocumentSeries.schema';
export { syncPushDocumentSeriesSchema, syncPullDocumentSeriesSchema } from './syncDocumentSeries.schema';
export { assignNextFolioSchema } from './assignNextFolio.schema';
export type { AssignNextFolioRequest } from './assignNextFolio.schema';
