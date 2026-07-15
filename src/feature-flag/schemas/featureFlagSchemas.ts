import { z } from 'zod';

export const FEATURE_FLAG_CONSTANTS = {
    KEY: { MAX_LENGTH: 100, PATTERN: /^[A-Z0-9][A-Z0-9_]*$/ },
    NAME: { MIN_LENGTH: 2, MAX_LENGTH: 120 },
    DESCRIPTION: { MAX_LENGTH: 500 },
} as const;

export const featureFlagIdParamSchema = z.object({
    id: z.string().uuid(),
});

export const listFeatureFlagsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    enabled: z.coerce.boolean().optional(),
});

export const createFeatureFlagSchema = z.object({
    key: z
        .string()
        .regex(FEATURE_FLAG_CONSTANTS.KEY.PATTERN, 'Key inválida (MAYÚSCULAS, números y _)')
        .max(FEATURE_FLAG_CONSTANTS.KEY.MAX_LENGTH),
    name: z
        .string()
        .min(FEATURE_FLAG_CONSTANTS.NAME.MIN_LENGTH)
        .max(FEATURE_FLAG_CONSTANTS.NAME.MAX_LENGTH),
    description: z.string().max(FEATURE_FLAG_CONSTANTS.DESCRIPTION.MAX_LENGTH).optional().nullable(),
    enabled: z.boolean().default(false),
    isPublic: z.boolean().default(true),
    tenantId: z.string().uuid().optional().nullable(),
});

export const updateFeatureFlagSchema = z.object({
    name: z
        .string()
        .min(FEATURE_FLAG_CONSTANTS.NAME.MIN_LENGTH)
        .max(FEATURE_FLAG_CONSTANTS.NAME.MAX_LENGTH)
        .optional(),
    description: z.string().max(FEATURE_FLAG_CONSTANTS.DESCRIPTION.MAX_LENGTH).optional().nullable(),
    isPublic: z.boolean().optional(),
});

export const toggleFeatureFlagSchema = z.object({
    enabled: z.boolean(),
});

export type ListFeatureFlagsInput = z.infer<typeof listFeatureFlagsSchema>;
export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
export type ToggleFeatureFlagInput = z.infer<typeof toggleFeatureFlagSchema>;
