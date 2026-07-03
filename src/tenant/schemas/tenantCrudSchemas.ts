import { z } from 'zod';

export const TENANT_CONSTANTS = {
    LIMITS: {
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 255,
        MAX_CODE_LENGTH: 50,
        MAX_DOMAIN_LENGTH: 100,
    },
    DEFAULTS: {
        MAX_USERS: 5,
        MAX_LOCATIONS: 1,
    },
    VALIDATION_PATTERNS: {
        CODE_PATTERN: /^[a-z0-9]+(-[a-z0-9]+)*$/,
    },
    STATUSES: ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'] as const,
    PLANS: ['STARTER', 'GROWTH', 'ENTERPRISE'] as const,
} as const;

export const listTenantsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
    plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
    search: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    sortBy: z.enum(['name', 'code', 'createdAt', 'mrr']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const getTenantByIdSchema = z.object({
    id: z.string().uuid('El ID del tenant debe ser un UUID válido'),
});

export const createTenantSchema = z.object({
    name: z
        .string()
        .min(TENANT_CONSTANTS.LIMITS.MIN_NAME_LENGTH)
        .max(TENANT_CONSTANTS.LIMITS.MAX_NAME_LENGTH),
    code: z
        .string()
        .regex(TENANT_CONSTANTS.VALIDATION_PATTERNS.CODE_PATTERN, 'Código inválido')
        .max(TENANT_CONSTANTS.LIMITS.MAX_CODE_LENGTH),
    plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']).default('STARTER'),
    maxUsers: z.number().int().positive().default(TENANT_CONSTANTS.DEFAULTS.MAX_USERS),
    maxLocations: z.number().int().positive().default(TENANT_CONSTANTS.DEFAULTS.MAX_LOCATIONS),
    tenantDomain: z.string().max(TENANT_CONSTANTS.LIMITS.MAX_DOMAIN_LENGTH).optional().nullable(),
});

export const updateTenantSchema = z.object({
    id: z.string().uuid(),
    name: z
        .string()
        .min(TENANT_CONSTANTS.LIMITS.MIN_NAME_LENGTH)
        .max(TENANT_CONSTANTS.LIMITS.MAX_NAME_LENGTH)
        .optional(),
    status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
    plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
    maxUsers: z.number().int().positive().optional(),
    maxLocations: z.number().int().positive().optional(),
});

export const suspendTenantSchema = z.object({
    id: z.string().uuid(),
    reason: z.string().max(500).optional(),
});

export const reactivateTenantSchema = z.object({
    id: z.string().uuid(),
});

export type ListTenantsInput = z.infer<typeof listTenantsSchema>;
export type GetTenantByIdInput = z.infer<typeof getTenantByIdSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type SuspendTenantInput = z.infer<typeof suspendTenantSchema>;
export type ReactivateTenantInput = z.infer<typeof reactivateTenantSchema>;