import { z } from 'zod';

export const listUsageLimitsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    planId: z.string().uuid().optional(),
});

export type ListUsageLimitsInput = z.infer<typeof listUsageLimitsSchema>;