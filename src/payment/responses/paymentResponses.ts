import type { PaymentSummaryPrimitives } from '../primitives';

export type PaymentListItem = PaymentSummaryPrimitives & {
    readonly currency: string;
    readonly transactionId: string | null;
    readonly paidAt: string | null;
    readonly createdAt: string;
};

export type PaymentListResponse = {
    readonly payments: readonly PaymentListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};