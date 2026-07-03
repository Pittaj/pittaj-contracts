/**
 * @fileoverview Schema Zod para reintentar onboarding (admin)
 * @module Onboarding/Contracts/Schemas
 */

import { z } from 'zod';

export const retryOnboardingSchema = z.object({
    reason: z.string().max(500).optional(),
});

export type RetryOnboardingInput = z.infer<typeof retryOnboardingSchema>;
