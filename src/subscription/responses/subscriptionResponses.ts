import type { SubscriptionSummaryPrimitives, SubscriptionPrimitives } from '../primitives';

export type SubscriptionListItem = SubscriptionSummaryPrimitives & {
    readonly pricePerLocation: number;
    readonly currency: string;
    readonly currentPeriodStart: string | null;
    readonly currentPeriodEnd: string | null;
    readonly trialEndsAt: string | null;
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

/** Detalle admin de una suscripción (para "Ver"). */
export type SubscriptionDetailResponse = {
    readonly subscription: SubscriptionPrimitives;
};
