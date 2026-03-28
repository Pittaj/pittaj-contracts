export interface CashMovementPrimitives {
  readonly id: string;
  readonly type: 'CASH_IN' | 'CASH_OUT';
  readonly reason: 'OPENING_FUND' | 'SALE' | 'REFUND' | 'EXPENSE' | 'WITHDRAWAL' | 'DEPOSIT' | 'CORRECTION' | 'TIP' | 'OTHER';
  readonly amount: number;
  readonly currency: string;
  readonly description: string | null;
  readonly userId: string;
  readonly occurredAt: string;
}
