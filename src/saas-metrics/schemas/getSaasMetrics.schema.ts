import { z } from 'zod';

/** Ventana de tiempo para las métricas SaaS. */
export const getSaasMetricsSchema = z.object({
    period: z.enum(['7d', '30d', '90d', '12m']).optional().default('30d'),
});

export type GetSaasMetricsInput = z.infer<typeof getSaasMetricsSchema>;
