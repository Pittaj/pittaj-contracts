import type { TenantMetricsPrimitives } from '../primitives/index.js';
import type { MrrMetricsPrimitives } from '../primitives/index.js';
import type { ChurnMetricsPrimitives } from '../primitives/index.js';
import type { OnboardingMetricsPrimitives } from '../primitives/index.js';
import type { AlertPrimitives } from '../primitives/index.js';

export type DashboardMetricsResponse = {
    readonly period: string;
    readonly tenantMetrics: TenantMetricsPrimitives;
    readonly mrrMetrics: MrrMetricsPrimitives;
    readonly churnMetrics: ChurnMetricsPrimitives;
    readonly onboardingMetrics: OnboardingMetricsPrimitives;
    readonly recentAlerts: readonly AlertPrimitives[];
};