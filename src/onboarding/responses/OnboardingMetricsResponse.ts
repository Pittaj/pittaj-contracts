/**
 * @fileoverview Respuesta de métricas de onboarding (admin)
 * @module Onboarding/Contracts/Responses
 */

import type { GroupByValue } from '../schemas';
import type { OnboardingStepValue } from '../primitives';

export interface ConversionByStep {
    readonly step: OnboardingStepValue;
    readonly stepName: string;
    readonly totalStarted: number;
    readonly totalCompleted: number;
    readonly totalFailed: number;
    readonly dropoffRate: number;
    readonly avgDurationMinutes: number | null;
}

export interface OnboardingMetricsResponse {
    readonly dateFrom: string;
    readonly dateTo: string;
    readonly groupBy: GroupByValue;
    readonly totalStarted: number;
    readonly totalCompleted: number;
    readonly totalFailed: number;
    readonly totalCancelled: number;
    readonly conversionRate: number;
    readonly avgDurationMinutes: number | null;
    readonly conversionByStep: readonly ConversionByStep[];
    readonly timeSeries: readonly {
        readonly date: string;
        readonly started: number;
        readonly completed: number;
        readonly failed: number;
    }[];
}
