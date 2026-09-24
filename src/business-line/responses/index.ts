/**
 * @fileoverview Barrel export para responses de BusinessLine.
 * @module Contracts/BusinessLine
 */

export type { BusinessLineResponse } from './BusinessLineResponse.js';
export type { CreateBusinessLineResponse } from './CreateBusinessLineResponse.js';
export type {
    SyncPullBusinessLineResponse,
    SyncPushBusinessLineResponse,
} from './SyncBusinessLineResponses.js';
