/**
 * @fileoverview Schema Zod para métricas de onboarding (admin)
 * @module Onboarding/Contracts/Schemas
 */

import { z } from 'zod';

export const GROUP_BY_VALUES = ['day', 'week', 'month'] as const;
export type GroupByValue = (typeof GROUP_BY_VALUES)[number];

export const getOnboardingMetricsSchema = z.object({
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
    groupBy: z.enum(GROUP_BY_VALUES).default('day'),
});

export type GetOnboardingMetricsInput = z.infer<typeof getOnboardingMetricsSchema>;
