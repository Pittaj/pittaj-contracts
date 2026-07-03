import { z } from 'zod';

export const getDashboardMetricsSchema = z.object({
    period: z.enum(['7d', '30d', '90d', '12m']).optional().default('30d'),
});

export type GetDashboardMetricsInput = z.infer<typeof getDashboardMetricsSchema>;