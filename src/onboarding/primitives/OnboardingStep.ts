/**
 * @fileoverview Valores de paso de onboarding
 * @module Onboarding/Domain/Primitives
 */

export const ONBOARDING_STEP_VALUES = ['STEP_1', 'STEP_2', 'STEP_3', 'STEP_4', 'STEP_5'] as const;
export type OnboardingStepValue = (typeof ONBOARDING_STEP_VALUES)[number];

export const ONBOARDING_STEP_ORDER: OnboardingStepValue[] = ['STEP_1', 'STEP_2', 'STEP_3', 'STEP_4', 'STEP_5'];

export const STEP_TO_NAME: Record<OnboardingStepValue, string> = {
    STEP_1: 'Empresa',
    STEP_2: 'Ubicación',
    STEP_3: 'Módulos',
    STEP_4: 'Equipo',
    STEP_5: 'Revisión',
};
