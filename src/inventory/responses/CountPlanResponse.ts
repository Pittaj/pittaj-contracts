/**
 * @fileoverview El plan de conteo cíclico y su cobertura.
 * @module Contracts/Inventory/Responses/CountPlan
 *
 * DTO del feed de sync (`entityType: 'count-plan'`): el plan se edita en cualquier punta; la
 * tanda la genera la nube (o el escritorio sin red, con el mismo algoritmo).
 */

import type { AbcClass, CountPlanStatus, CountPlanStrategy } from '../schemas/countPlan.schema.js';
import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';

/** Cuánto del plan está al día: productos contados dentro de su frecuencia, por clase. */
export interface CountPlanCoverageResponse {
    readonly abcClass: AbcClass;
    readonly products: number;
    readonly countedOnTime: number;
    readonly overdue: number;
    /** Exactitud del último conteo de la clase: renglones que cuadraron / renglones contados. */
    readonly accuracy: number | null;
}

export interface CountPlanResponse {
    readonly id: string;
    readonly name: string;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly strategy: CountPlanStrategy;
    readonly status: CountPlanStatus;
    readonly frequencyDays: { readonly A: number; readonly B: number; readonly C: number } | null;
    readonly categoryIds: readonly string[];
    readonly itemsPerRun: number;
    readonly weekdays: readonly number[];
    readonly includeLastDiscrepancies: boolean;
    readonly includeNegatives: boolean;
    readonly blind: boolean;
    readonly assigneeUserId: string | null;
    readonly assigneeName: string | null;

    /** La última tanda y la próxima. */
    readonly lastRunAt: string | null;
    readonly lastCountId: string | null;
    readonly lastCountNumber: string | null;
    readonly nextRunAt: string | null;

    readonly coverage: readonly CountPlanCoverageResponse[];

    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly version: number;
}

export type SyncPullCountPlanResponse = SyncPullResponse<CountPlanResponse>;
export type SyncPushCountPlanResponse = SyncPushResponse;
