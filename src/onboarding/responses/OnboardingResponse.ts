/**
 * @fileoverview Respuesta al completar onboarding
 * @module Onboarding/Contracts/Responses
 */

export interface OnboardingResponse {
    readonly companyId: string;
    readonly locationId: string;
    readonly tenantId: string;
    readonly userId: string;
    readonly subscriptionId: string;
}
