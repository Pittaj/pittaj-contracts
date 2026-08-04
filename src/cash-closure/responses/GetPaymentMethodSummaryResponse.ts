import type { MoneyPrimitives } from '../../shared/index.js';

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
