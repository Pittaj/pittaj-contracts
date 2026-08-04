import type { MoneyPrimitives } from '../../shared/index.js';

export interface CashClosurePaymentSummaryPrimitives {
  readonly paymentMethodId: string;
  readonly paymentMethodName: string;
  readonly isCashCount: boolean;
  readonly expectedAmount: MoneyPrimitives;
  readonly actualAmount: MoneyPrimitives;
  readonly transactionCount: number;
}
