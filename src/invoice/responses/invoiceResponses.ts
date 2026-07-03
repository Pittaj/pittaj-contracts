import type { InvoiceSummaryPrimitives } from '../primitives';

export type InvoiceListItem = InvoiceSummaryPrimitives & {
    readonly subscriptionId: string;
    readonly currency: string;
    readonly issuedAt: string;
};

export type InvoiceListResponse = {
    readonly invoices: readonly InvoiceListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};