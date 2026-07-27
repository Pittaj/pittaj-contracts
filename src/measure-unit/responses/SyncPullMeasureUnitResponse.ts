/**
 * @fileoverview Response de sincronización Pull de MeasureUnit
 * @module Contracts/MeasureUnit/Responses/SyncPullMeasureUnitResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de MeasureUnit (shape que ya parsea el desktop).
 */

import type { MeasureUnitResponse } from './MeasureUnitResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullMeasureUnitResponse = SyncPullResponse<MeasureUnitResponse>;
