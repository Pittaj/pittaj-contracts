export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';

export type InvoicePrimitives = {
    readonly id: string;
    readonly tenantId: string;
    readonly tenantName: string;
    readonly subscriptionId: string;
    readonly invoiceNumber: string;
    readonly status: InvoiceStatus;
    readonly amount: number;
    readonly currency: string;
    readonly dueDate: string;
    readonly issuedAt: string;
    readonly paidAt: string | null;
    readonly createdAt: string;
};

export type InvoiceSummaryPrimitives = {
    readonly id: string;
    readonly invoiceNumber: string;
    readonly tenantName: string;
    readonly amount: number;
    readonly status: InvoiceStatus;
    readonly dueDate: string;
};