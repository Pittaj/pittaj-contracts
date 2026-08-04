/**
 * @fileoverview Response de sincronización Pull de Purchase
 * @module Contracts/Purchase/Responses/SyncPullPurchaseResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Purchase (shape que ya parsea el desktop).
 */

import type { PurchaseResponse } from './PurchaseResponse.js';
import type { SyncPullResponse } from '../../sync/index.js';

export type SyncPullPurchaseResponse = SyncPullResponse<PurchaseResponse>;
