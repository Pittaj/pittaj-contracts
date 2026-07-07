/**
 * @fileoverview Response de sincronización Pull de PriceList
 * @module Contracts/PriceList/Responses/SyncPullPriceListResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de PriceList (shape que ya parsea el desktop).
 */

import type { PriceListResponse } from './PriceListResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullPriceListResponse = SyncPullResponse<PriceListResponse>;
