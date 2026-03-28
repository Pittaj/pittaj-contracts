import type { MoneyPrimitives } from '../../primitives';

/** Resumen por método de pago. */
export interface PaymentMethodSummary {
    readonly paymentMethodId: string;
    readonly paymentMethodName: string;
    readonly totalExpected: MoneyPrimitives;
    readonly totalActual: MoneyPrimitives;
    readonly totalDifference: MoneyPrimitives;
    readonly transactionCount: number;
}

export interface GetPaymentMethodSummaryResponse {
    readonly summaries: PaymentMethodSummary[];
}
