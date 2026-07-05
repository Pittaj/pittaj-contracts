/**
 * @fileoverview Response de sincronización Pull de Customer
 * @module SyncPullCustomerResponse
 * @version 2.0.0
 *
 * Deriva del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Customer (shape que ya parsea el desktop).
 */

import type { CustomerResponse } from './CustomerResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullCustomerResponse = SyncPullResponse<CustomerResponse>;
