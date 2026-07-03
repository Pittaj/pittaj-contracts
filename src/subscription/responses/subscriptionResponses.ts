import type { SubscriptionSummaryPrimitives } from '../primitives';

export type SubscriptionListItem = SubscriptionSummaryPrimitives & {
    readonly planId: string;
    readonly currentPeriodStart: string;
    readonly currentPeriodEnd: string;
    readonly currency: string;
    readonly createdAt: string;
};

export type SubscriptionListResponse = {
    readonly subscriptions: readonly SubscriptionListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};