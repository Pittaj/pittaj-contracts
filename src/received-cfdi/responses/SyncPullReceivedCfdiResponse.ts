/**
 * @fileoverview Response de sincronización Pull de ReceivedCfdi.
 * @module Contracts/ReceivedCfdi/Responses/SyncPullReceivedCfdiResponse
 * @version 1.0.0
 */

import type { ReceivedCfdiResponse } from './ReceivedCfdiResponse.js';
import type { SyncPullResponse } from '../../sync/index.js';

export type SyncPullReceivedCfdiResponse = SyncPullResponse<ReceivedCfdiResponse>;
