import { z } from 'zod';

/** Config de plataforma: forma fija (singleton), editable por super_admin. */
export const updatePlatformConfigSchema = z.object({
    platformName: z.string().min(1).max(120),
    supportEmail: z.string().email(),
    maxTrialDays: z.number().int().min(0).max(365),
    defaultPlanId: z.string().max(100),
    /** Timbres CFDI al mes de una cuenta sin plan; con plan mandan los del plan. */
    includedStampsPerMonth: z.number().int().min(0).max(1_000_000),
    maintenanceMode: z.boolean(),
    /** Exigir dispositivo registrado para sincronizar (corta instalaciones sin alta). */
    requireDeviceId: z.boolean(),
    /** Aplicar los cortes por falta de pago (solo timbrado y sincronización). */
    enforcePastDue: z.boolean(),
    /** Días de gracia antes del corte. */
    graceDaysAfterDue: z.number().int().min(0).max(60),
    features: z.object({
        onboardingEnabled: z.boolean(),
        couponSystemEnabled: z.boolean(),
        apiAccessEnabled: z.boolean(),
    }),
});

export type UpdatePlatformConfigInput = z.infer<typeof updatePlatformConfigSchema>;
