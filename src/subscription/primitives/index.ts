export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';

export type SubscriptionPrimitives = {
    readonly id: string;
    readonly tenantId: string;
    readonly tenantName: string;
    readonly planId: string;
    readonly planName: string;
    readonly status: SubscriptionStatus;
    readonly currentPeriodStart: string;
    readonly currentPeriodEnd: string;
    readonly cancelAtPeriodEnd: boolean;
    readonly mrr: number;
    readonly currency: string;
    readonly createdAt: string;
    readonly updatedAt: string;
};

export type SubscriptionSummaryPrimitives = {
    readonly id: string;
    readonly tenantId: string;
    readonly tenantName: string;
    readonly planName: string;
    readonly status: SubscriptionStatus;
    readonly mrr: number;
};