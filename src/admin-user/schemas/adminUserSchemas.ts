import { z } from 'zod';

export const ADMIN_USER_CONSTANTS = {
    LIMITS: {
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 100,
        MIN_EMAIL_LENGTH: 5,
        MAX_EMAIL_LENGTH: 255,
    },
    STATUSES: ['ACTIVE', 'INACTIVE', 'PENDING'] as const,
} as const;

export const listAdminUsersSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
    search: z.string().optional(),
    roleId: z.string().uuid().optional(),
    sortBy: z.enum(['email', 'firstName', 'lastName', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createAdminUserSchema = z.object({
    email: z.string().email('Email inválido').min(ADMIN_USER_CONSTANTS.LIMITS.MIN_EMAIL_LENGTH).max(ADMIN_USER_CONSTANTS.LIMITS.MAX_EMAIL_LENGTH),
    firstName: z.string().min(ADMIN_USER_CONSTANTS.LIMITS.MIN_NAME_LENGTH).max(ADMIN_USER_CONSTANTS.LIMITS.MAX_NAME_LENGTH),
    lastName: z.string().min(ADMIN_USER_CONSTANTS.LIMITS.MIN_NAME_LENGTH).max(ADMIN_USER_CONSTANTS.LIMITS.MAX_NAME_LENGTH),
    roleId: z.string().uuid('ID de rol inválido'),
});

export const deactivateAdminUserSchema = z.object({
    id: z.string().uuid(),
    reason: z.string().max(500).optional(),
});

/** Param `:id` de las rutas de detalle/desactivación. */
export const adminUserIdParamSchema = z.object({
    id: z.string().uuid(),
});

/** Body de POST /:id/deactivate (el id va en el path). */
export const deactivateAdminUserBodySchema = z.object({
    reason: z.string().max(500).optional(),
});

export type ListAdminUsersInput = z.infer<typeof listAdminUsersSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type DeactivateAdminUserInput = z.infer<typeof deactivateAdminUserSchema>;