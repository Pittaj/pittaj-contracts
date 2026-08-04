/**
 * @fileoverview Response de sincronización Pull de Promotion
 * @module Contracts/Promotion/Responses/SyncPullPromotionResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Promotion (shape que ya parsea el desktop).
 */

import type { PromotionResponse } from './PromotionResponse.js';
import type { SyncPullResponse } from '../../sync/index.js';

export type SyncPullPromotionResponse = SyncPullResponse<PromotionResponse>;
