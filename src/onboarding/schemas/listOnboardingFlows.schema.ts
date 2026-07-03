/**
 * @fileoverview Schema Zod para listar flujos de onboarding (admin)
 * @module Onboarding/Contracts/Schemas
 */

import { z } from 'zod';

export const ONBOARDING_STATUS_VALUES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;
export type OnboardingStatusValue = (typeof ONBOARDING_STATUS_VALUES)[number];

export const listOnboardingFlowsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(ONBOARDING_STATUS_VALUES).optional(),
    plan: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    search: z.string().max(200).optional(),
});

export type ListOnboardingFlowsInput = z.infer<typeof listOnboardingFlowsSchema>;
