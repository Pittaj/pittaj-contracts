/**
 * @fileoverview Response de sincronización Pull de Tax
 * @module Contracts/Tax/Responses/SyncPullTaxResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Tax (shape que ya parsea el desktop).
 */

import type { TaxResponse } from './TaxResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullTaxResponse = SyncPullResponse<TaxResponse>;
