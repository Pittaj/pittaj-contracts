import { z } from 'zod';

export const listAuditLogsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    userId: z.string().uuid().optional(),
    action: z.string().optional(),
    resource: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;