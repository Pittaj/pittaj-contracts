/**
 * @fileoverview Response DTO canónico de PosSession
 * @module PosSessionResponse
 * @version 1.0.0
 */

import type { OpeningBalancePrimitives } from '../../shared';
import type { ClosingBalancePrimitives } from '../../shared';
import type { CashMovementPrimitives } from '../../shared';
import type { SessionSummaryPrimitives } from '../primitives';

export interface PosSessionResponse {
    readonly id: string;
    readonly tenantId: string;
    readonly status: string;
    readonly sequence: number;
    readonly locationId: string;
    readonly userId: string;
    readonly openingBalance: OpeningBalancePrimitives;
    readonly closingBalance: ClosingBalancePrimitives | null;
    readonly cashMovements: CashMovementPrimitives[];
    readonly summary: SessionSummaryPrimitives | null;
    readonly cashClosureId: string | null;
    readonly notes: string | null;
    readonly currentCashBalance: number;
    readonly openedAt: string;
    readonly closedAt: string | null;
    readonly createdBy: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly version: number;
}
