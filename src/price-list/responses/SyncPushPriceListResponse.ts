/**
 * @fileoverview Response de sincronización Push de PriceList
 * @module Contracts/PriceList/Responses/SyncPushPriceListResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync.
 */

import type { SyncPushResponse, SyncPushItemResult } from '../../sync';

export type { SyncPushItemResult };

export type SyncPushPriceListResponse = SyncPushResponse;
