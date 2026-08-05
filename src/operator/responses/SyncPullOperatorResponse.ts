/**
 * @fileoverview Response de sincronización Pull de Operator.
 * @module Contracts/Operator/Responses
 *
 * Type-alias del response genérico canónico de src/sync: los `changes` son DTOs
 * planos de Operator (el mismo shape que produce y consume el desktop).
 */

import type { OperatorResponse } from './OperatorResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullOperatorResponse = SyncPullResponse<OperatorResponse>;
