import type { TenantMetricsPrimitives } from '../primitives';
import type { MrrMetricsPrimitives } from '../primitives';
import type { ChurnMetricsPrimitives } from '../primitives';
import type { OnboardingMetricsPrimitives } from '../primitives';
import type { AlertPrimitives } from '../primitives';

export type DashboardMetricsResponse = {
    readonly period: string;
    readonly tenantMetrics: TenantMetricsPrimitives;
    readonly mrrMetrics: MrrMetricsPrimitives;
    readonly churnMetrics: ChurnMetricsPrimitives;
    readonly onboardingMetrics: OnboardingMetricsPrimitives;
    readonly recentAlerts: readonly AlertPrimitives[];
};