/**
 * @fileoverview Response de sincronización Pull de Location
 * @module Contracts/Location/Responses/SyncPullLocationResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Location (shape que ya parsea el desktop).
 */

import type { LocationResponse } from './LocationResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullLocationResponse = SyncPullResponse<LocationResponse>;
