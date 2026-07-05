/**
 * @fileoverview Response de sincronización Pull de Department
 * @module Contracts/Department/Responses/SyncPullDepartmentResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de Department (shape que ya parsea el desktop).
 */

import type { DepartmentResponse } from './DepartmentResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullDepartmentResponse = SyncPullResponse<DepartmentResponse>;
