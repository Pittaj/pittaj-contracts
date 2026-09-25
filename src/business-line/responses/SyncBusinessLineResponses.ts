/**
 * @fileoverview Responses de sincronización de BusinessLine.
 * @module Contracts/BusinessLine/Responses
 *
 * Type-alias de los responses genéricos canónicos de src/sync: los `changes`
 * del pull son DTOs planos de BusinessLine.
 */

import type { BusinessLineResponse } from './BusinessLineResponse.js';
import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';

export type SyncPullBusinessLineResponse = SyncPullResponse<BusinessLineResponse>;
export type SyncPushBusinessLineResponse = SyncPushResponse;
