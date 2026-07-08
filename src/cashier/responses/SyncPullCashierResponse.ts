/**
 * @fileoverview Response de sincronización Pull de Cashier
 * @module Contracts/Cashier/Responses/SyncPullCashierResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Cashier (shape que ya parsea el desktop, SIN pin).
 */

import type { CashierResponse } from './CashierResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullCashierResponse = SyncPullResponse<CashierResponse>;
