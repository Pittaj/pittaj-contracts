/**
 * @fileoverview Response de sincronización Pull de Register
 * @module Contracts/Register/Responses/SyncPullRegisterResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Register (shape que ya parsea el desktop).
 */

import type { RegisterResponse } from './RegisterResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullRegisterResponse = SyncPullResponse<RegisterResponse>;
