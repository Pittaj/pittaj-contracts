/**
 * @fileoverview Responses de sync de Producción (alias del canónico de src/sync).
 * @module Contracts/Production/Responses
 */

import type { RecipeResponse } from './RecipeResponse';
import type { ProductionOrderResponse } from './ProductionOrderResponse';
import type { SyncPullResponse, SyncPushResponse } from '../../sync';


export type SyncPushRecipeResponse = SyncPushResponse;
export type SyncPullRecipeResponse = SyncPullResponse<RecipeResponse>;

export type SyncPushProductionOrderResponse = SyncPushResponse;
export type SyncPullProductionOrderResponse = SyncPullResponse<ProductionOrderResponse>;
