/**
 * @fileoverview Response de sincronización Pull de SalesReturn.
 * @module Contracts/SalesReturn/Responses/SyncPullSalesReturnResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs de SalesReturn (con líneas hijas anidadas; shape que parsea el desktop).
 */

import type { SalesReturnResponse } from './SalesReturnResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullSalesReturnResponse = SyncPullResponse<SalesReturnResponse>;
