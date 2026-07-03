import { z } from 'zod';

export const listFeatureFlagsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    enabled: z.boolean().optional(),
});

export type ListFeatureFlagsInput = z.infer<typeof listFeatureFlagsSchema>;