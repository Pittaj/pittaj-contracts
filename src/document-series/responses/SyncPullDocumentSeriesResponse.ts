/**
 * @fileoverview Response de sincronización Pull de DocumentSeries
 * @module Contracts/DocumentSeries/Responses/SyncPullDocumentSeriesResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de DocumentSeries (shape que ya parsea el desktop).
 */

import type { DocumentSeriesResponse } from './DocumentSeriesResponse.js';
import type { SyncPullResponse } from '../../sync/index.js';

export type SyncPullDocumentSeriesResponse = SyncPullResponse<DocumentSeriesResponse>;
