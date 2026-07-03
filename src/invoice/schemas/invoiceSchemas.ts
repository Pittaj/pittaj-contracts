import { z } from 'zod';

export const listInvoicesSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
    tenantId: z.string().uuid().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['invoiceNumber', 'amount', 'dueDate', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListInvoicesInput = z.infer<typeof listInvoicesSchema>;