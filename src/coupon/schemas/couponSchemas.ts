import { z } from 'zod';

export const listCouponsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'USED_OUT']).optional(),
    search: z.string().optional(),
});

export type ListCouponsInput = z.infer<typeof listCouponsSchema>;