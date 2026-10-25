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

// ── Auth del backoffice (login dedicado contra admin_users) ──

/** Query de GET /api/admin/auth/salt (público, anti-enumeración). */
export const getAdminSaltSchema = z.object({
    email: z.string().email('Email inválido'),
});

/** Body de POST /api/admin/auth/login (clientHash = Argon2id(password, salt) del cliente). */
export const adminLoginSchema = z.object({
    email: z.string().email('Email inválido'),
    clientHash: z.string().min(1),
    deviceId: z.string().optional(),
});

/** Body de POST /api/admin/auth/refresh. */
export const adminRefreshSchema = z.object({
    refreshToken: z.string().min(1),
});

/** Body de POST /api/admin/admin-users/:id/set-password (activa la cuenta). */
export const setAdminPasswordSchema = z.object({
    clientHash: z.string().min(1),
    salt: z.string().min(1).max(64),
});

/**
 * Body de PUT /api/admin/auth/password — el operador cambia **su** contraseña. Mismo esquema que el
 * login: `currentClientHash` es Argon2id(contraseña actual, salt guardado); el nuevo se deriva con un
 * salt nuevo. Antes «Mi cuenta» usaba `/api/auth/password`, el de los negocios, y no servía.
 */
export const changeOwnAdminPasswordSchema = z.object({
    currentClientHash: z.string().min(1),
    newClientHash: z.string().min(1),
    newSalt: z.string().min(1).max(64),
});

export type GetAdminSaltInput = z.infer<typeof getAdminSaltSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminRefreshInput = z.infer<typeof adminRefreshSchema>;
export type SetAdminPasswordInput = z.infer<typeof setAdminPasswordSchema>;
export type ChangeOwnAdminPasswordInput = z.infer<typeof changeOwnAdminPasswordSchema>;

export type ListAdminUsersInput = z.infer<typeof listAdminUsersSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type DeactivateAdminUserInput = z.infer<typeof deactivateAdminUserSchema>;