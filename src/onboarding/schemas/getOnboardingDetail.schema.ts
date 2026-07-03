/**
 * @fileoverview Schema Zod para obtener detalle de onboarding (admin)
 * @module Onboarding/Contracts/Schemas
 */

import { z } from 'zod';

export const getOnboardingDetailSchema = z.object({
    id: z.string().uuid('ID de sesión inválido'),
});

export type GetOnboardingDetailInput = z.infer<typeof getOnboardingDetailSchema>;
