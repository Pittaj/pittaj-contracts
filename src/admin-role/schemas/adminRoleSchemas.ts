import { z } from 'zod';

export const listAdminRolesSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ListAdminRolesInput = z.infer<typeof listAdminRolesSchema>;