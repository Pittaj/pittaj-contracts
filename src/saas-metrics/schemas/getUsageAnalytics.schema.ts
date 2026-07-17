import { z } from 'zod';

/** Ventana de tiempo de las analíticas de uso (misma que las métricas SaaS). */
export const getUsageAnalyticsSchema = z.object({
    period: z.enum(['7d', '30d', '90d', '12m']).optional().default('30d'),
});

export type GetUsageAnalyticsInput = z.infer<typeof getUsageAnalyticsSchema>;
