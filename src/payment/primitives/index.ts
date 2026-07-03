export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PaymentPrimitives = {
    readonly id: string;
    readonly invoiceId: string;
    readonly tenantId: string;
    readonly tenantName: string;
    readonly amount: number;
    readonly currency: string;
    readonly method: string;
    readonly status: PaymentStatus;
    readonly transactionId: string | null;
    readonly paidAt: string | null;
    readonly createdAt: string;
};

export type PaymentSummaryPrimitives = {
    readonly id: string;
    readonly invoiceId: string;
    readonly tenantName: string;
    readonly amount: number;
    readonly status: PaymentStatus;
    readonly method: string;
};