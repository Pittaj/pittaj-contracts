/**
 * @fileoverview Tipos primitivos para serialización de OnboardingSession
 * @module Onboarding/Domain/Primitives
 */

import type { OnboardingStatusValue } from '../schemas/listOnboardingFlows.schema';
import type { OnboardingStepValue } from './OnboardingStep';
import type { IndustryValue, EmployeeCountValue, ModuleValue, PlanValue } from '../schemas/completeOnboarding.schema';

export type { IndustryValue, EmployeeCountValue, ModuleValue, PlanValue };
export type { OnboardingStatusValue };
export type { OnboardingStepValue } from './OnboardingStep';

export interface OnboardingProgressPrimitives {
    readonly currentStep: OnboardingStepValue;
    readonly completedSteps: readonly OnboardingStepValue[];
    readonly failedStep: OnboardingStepValue | null;
}

export interface CompanyDataPrimitives {
    readonly name: string;
    readonly taxId: string | null;
    readonly country: string;
    readonly industry: IndustryValue;
    readonly employeeCount: EmployeeCountValue;
}

export interface LocationDataPrimitives {
    readonly name: string;
}

export interface TeamMemberPrimitives {
    readonly email: string;
    readonly role: string;
    readonly firstName: string | null;
    readonly lastName: string | null;
}

export interface OnboardingSessionPrimitives {
    readonly id: string;
    readonly userId: string;
    readonly tenantId: string | null;
    readonly status: OnboardingStatusValue;
    readonly currentStep: OnboardingStepValue;
    readonly progress: OnboardingProgressPrimitives;
    readonly companyData: CompanyDataPrimitives | null;
    readonly locationData: LocationDataPrimitives | null;
    readonly selectedModules: ModuleValue[];
    readonly recommendedPlan: PlanValue;
    readonly teamMembers: TeamMemberPrimitives[];
    readonly retryCount: number;
    readonly lastError: string | null;
    readonly startedAt: string;
    readonly completedAt: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
}
