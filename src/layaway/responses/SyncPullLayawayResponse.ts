/**
 * @fileoverview Response de sincronización Pull de Layaway.
 * @module Contracts/Layaway/Responses/SyncPullLayawayResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs de Layaway (con líneas hijas anidadas; shape que parsea el desktop).
 */

import type { LayawayResponse } from './LayawayResponse.js';
import type { SyncPullResponse } from '../../sync/index.js';

export type SyncPullLayawayResponse = SyncPullResponse<LayawayResponse>;
