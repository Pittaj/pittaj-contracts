import { z } from 'zod';

export const ADMIN_ROLE_CONSTANTS = {
    NAME: { MIN_LENGTH: 2, MAX_LENGTH: 100 },
    DESCRIPTION: { MAX_LENGTH: 500 },
    PERMISSION: { MAX_LENGTH: 100 },
} as const;

export const adminRoleIdParamSchema = z.object({
    id: z.string().uuid(),
});

export const listAdminRolesSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
});

const permissionsSchema = z
    .array(z.string().trim().min(1).max(ADMIN_ROLE_CONSTANTS.PERMISSION.MAX_LENGTH))
    .max(200);

export const createAdminRoleSchema = z.object({
    name: z.string().trim().min(ADMIN_ROLE_CONSTANTS.NAME.MIN_LENGTH).max(ADMIN_ROLE_CONSTANTS.NAME.MAX_LENGTH),
    description: z.string().max(ADMIN_ROLE_CONSTANTS.DESCRIPTION.MAX_LENGTH).optional().nullable(),
    permissions: permissionsSchema.default([]),
});

export const updateAdminRoleSchema = z.object({
    name: z
        .string()
        .trim()
        .min(ADMIN_ROLE_CONSTANTS.NAME.MIN_LENGTH)
        .max(ADMIN_ROLE_CONSTANTS.NAME.MAX_LENGTH)
        .optional(),
    description: z.string().max(ADMIN_ROLE_CONSTANTS.DESCRIPTION.MAX_LENGTH).optional().nullable(),
    permissions: permissionsSchema.optional(),
});

export type ListAdminRolesInput = z.infer<typeof listAdminRolesSchema>;
export type CreateAdminRoleInput = z.infer<typeof createAdminRoleSchema>;
export type UpdateAdminRoleInput = z.infer<typeof updateAdminRoleSchema>;
