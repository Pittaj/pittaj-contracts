/**
 * @fileoverview Response de sincronización Push de MeasureUnit
 * @module Contracts/MeasureUnit/Responses/SyncPushMeasureUnitResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync.
 */

import type { SyncPushResponse, SyncPushItemResult } from '../../sync/index.js';

export type { SyncPushItemResult };

export type SyncPushMeasureUnitResponse = SyncPushResponse;
