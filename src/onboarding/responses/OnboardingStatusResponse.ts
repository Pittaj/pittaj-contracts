/**
 * @fileoverview Respuesta de estado de onboarding para usuario
 * @module Onboarding/Contracts/Responses
 */

import type { OnboardingStatusValue } from '../schemas';
import type { OnboardingStepValue } from '../primitives';

export interface OnboardingStatusResponse {
    readonly isComplete: boolean;
    readonly companyId: string | null;
    readonly locationId: string | null;
    readonly tenantId: string | null;
    readonly status: OnboardingStatusValue | null;
    readonly currentStep: OnboardingStepValue | null;
    readonly progress: {
        readonly currentStep: OnboardingStepValue;
        readonly completedSteps: readonly OnboardingStepValue[];
        readonly failedStep: OnboardingStepValue | null;
    } | null;
}
