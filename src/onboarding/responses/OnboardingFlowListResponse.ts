/**
 * @fileoverview Respuesta de lista de flujos de onboarding (admin)
 * @module Onboarding/Contracts/Responses
 */

import type { OnboardingStatusValue, IndustryValue, EmployeeCountValue, ModuleValue, PlanValue } from '../schemas';
import type { OnboardingStepValue } from '../primitives';

export interface OnboardingFlowListItem {
    readonly id: string;
    readonly userId: string;
    readonly userEmail: string;
    readonly tenantId: string | null;
    readonly tenantName: string | null;
    readonly status: OnboardingStatusValue;
    readonly currentStep: OnboardingStepValue;
    readonly selectedModules: ModuleValue[];
    readonly recommendedPlan: PlanValue;
    readonly industry: IndustryValue | null;
    readonly employeeCount: EmployeeCountValue | null;
    readonly retryCount: number;
    readonly startedAt: string;
    readonly completedAt: string | null;
}

export interface OnboardingFlowListResponse {
    readonly items: readonly OnboardingFlowListItem[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly pages: number;
}
