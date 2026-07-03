/**
 * @fileoverview Schema Zod para exportar datos de onboarding (admin)
 * @module Onboarding/Contracts/Schemas
 */

import { z } from 'zod';

export const EXPORT_FORMAT_VALUES = ['csv', 'xlsx'] as const;
export type ExportFormatValue = (typeof EXPORT_FORMAT_VALUES)[number];

export const exportOnboardingSchema = z.object({
    format: z.enum(EXPORT_FORMAT_VALUES).default('csv'),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});

export type ExportOnboardingInput = z.infer<typeof exportOnboardingSchema>;
