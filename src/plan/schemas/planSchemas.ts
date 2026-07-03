import { z } from 'zod';

export const PLAN_CONSTANTS = {
    LIMITS: {
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 100,
        MAX_CODE_LENGTH: 50,
        MAX_DESCRIPTION_LENGTH: 500,
    },
    PERIODS: {
        STARTER: 30,
        GROWTH: 30,
        ENTERPRISE: 365,
    },
    STATUSES: ['DRAFT', 'ACTIVE', 'INACTIVE'] as const,
} as const;

export const listPlansSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'price', 'displayOrder', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const createPlanSchema = z.object({
    name: z.string().min(PLAN_CONSTANTS.LIMITS.MIN_NAME_LENGTH).max(PLAN_CONSTANTS.LIMITS.MAX_NAME_LENGTH),
    code: z.string().regex(/^[A-Z0-9][A-Z0-9_-]*$/i, 'Código inválido').max(PLAN_CONSTANTS.LIMITS.MAX_CODE_LENGTH),
    description: z.string().max(PLAN_CONSTANTS.LIMITS.MAX_DESCRIPTION_LENGTH).optional(),
    price: z.number().min(0, 'El precio no puede ser negativo'),
    currency: z.string().default('MXN'),
    periodDays: z.number().int().positive().default(30),
    features: z.array(z.string()).default([]),
    limits: z.object({
        maxUsers: z.number().int().positive().default(5),
        maxLocations: z.number().int().positive().default(1),
        maxProducts: z.number().int().positive().default(100),
        hasAnalytics: z.boolean().default(false),
        hasApiAccess: z.boolean().default(false),
    }),
    displayOrder: z.number().int().nonnegative().default(0),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
    id: z.string().uuid(),
});

export type ListPlansInput = z.infer<typeof listPlansSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;