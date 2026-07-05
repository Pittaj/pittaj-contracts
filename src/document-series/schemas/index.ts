/**
 * @fileoverview Barrel export para schemas de DocumentSeries.
 * @module Contracts/DocumentSeries
 */

export * from './createDocumentSeries.schema';
export * from './documentSeriesIdParam.schema';
export * from './getDocumentSeries.schema';
export { syncPushDocumentSeriesSchema, syncPullDocumentSeriesSchema } from './syncDocumentSeries.schema';
