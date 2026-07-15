import { z } from 'zod';

/** Config de plataforma: forma fija (singleton), editable por super_admin. */
export const updatePlatformConfigSchema = z.object({
    platformName: z.string().min(1).max(120),
    supportEmail: z.string().email(),
    maxTrialDays: z.number().int().min(0).max(365),
    defaultPlanId: z.string().max(100),
    maintenanceMode: z.boolean(),
    features: z.object({
        onboardingEnabled: z.boolean(),
        couponSystemEnabled: z.boolean(),
        apiAccessEnabled: z.boolean(),
    }),
});

export type UpdatePlatformConfigInput = z.infer<typeof updatePlatformConfigSchema>;
