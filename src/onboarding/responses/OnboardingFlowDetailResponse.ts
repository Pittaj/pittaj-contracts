/**
 * @fileoverview Respuesta de detalle de flujo de onboarding (admin)
 * @module Onboarding/Contracts/Responses
 */

import type { OnboardingStatusValue, IndustryValue, EmployeeCountValue, ModuleValue, PlanValue } from '../schemas';
import type { OnboardingStepValue, TeamMemberPrimitives } from '../primitives';

export interface OnboardingRetryInfo {
    readonly retryCount: number;
    readonly lastError: string | null;
    readonly lastRetryAt: string | null;
    readonly previousAttempts: readonly {
        readonly attemptedAt: string;
        readonly reason: string | null;
    }[];
}

export interface OnboardingEvent {
    readonly type: string;
    readonly occurredAt: string;
    readonly data: Record<string, unknown>;
}

export interface OnboardingFlowDetailResponse {
    readonly id: string;
    readonly userId: string;
    readonly userEmail: string;
    readonly userFirstName: string | null;
    readonly userLastName: string | null;
    readonly tenantId: string | null;
    readonly tenantName: string | null;
    readonly status: OnboardingStatusValue;
    readonly currentStep: OnboardingStepValue;
    readonly progress: {
        readonly currentStep: OnboardingStepValue;
        readonly completedSteps: readonly OnboardingStepValue[];
        readonly failedStep: OnboardingStepValue | null;
    };
    readonly companyData: {
        readonly name: string | null;
        readonly taxId: string | null;
        readonly country: string | null;
        readonly industry: IndustryValue | null;
        readonly employeeCount: EmployeeCountValue | null;
    } | null;
    readonly locationData: {
        readonly name: string | null;
    } | null;
    readonly selectedModules: ModuleValue[];
    readonly recommendedPlan: PlanValue;
    readonly teamMembers: readonly TeamMemberPrimitives[];
    readonly retryInfo: OnboardingRetryInfo;
    readonly events: readonly OnboardingEvent[];
    readonly startedAt: string;
    readonly completedAt: string | null;
    readonly durationMinutes: number | null;
}
