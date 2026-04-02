/**
 * @fileoverview Response DTO canónico de CashClosure
 * @module CashClosureResponse
 * @version 1.0.0
 */

import type { CashClosurePaymentSummaryPrimitives } from '../primitives';
import type { CashClosurePeriodPrimitives } from '../primitives';
import type {MoneyPrimitives} from '../../shared';

export interface CashClosureResponse {
    readonly id: string;
    readonly tenantId: string;
    readonly status: string;
    readonly shift: string;
    readonly period: CashClosurePeriodPrimitives;
    readonly posSessionId: string;
    readonly locationId: string;
    readonly userId: string;
    readonly openingFund: MoneyPrimitives;
    readonly paymentSummaries: CashClosurePaymentSummaryPrimitives[];
    readonly notes: string | null;
    readonly rejectionReason: string | null;
    readonly reviewedBy: string | null;
    readonly reviewedAt: string | null;
    readonly totalExpected: MoneyPrimitives;
    readonly totalActual: MoneyPrimitives;
    readonly totalDifference: MoneyPrimitives;
    readonly createdBy: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly version: number;
}
