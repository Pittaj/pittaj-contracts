/**
 * @fileoverview Response de sincronización Pull de Company
 * @module Contracts/Company/Responses/SyncPullCompanyResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Company (shape que ya parsea el desktop).
 */

import type { CompanyResponse } from './CompanyResponse.js';
import type { SyncPullResponse } from '../../sync/index.js';

export type SyncPullCompanyResponse = SyncPullResponse<CompanyResponse>;
