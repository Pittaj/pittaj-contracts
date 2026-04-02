export interface SalePaymentBasePrimitives {
  readonly id: string;
  readonly paymentMethodId: string;
  readonly paymentMethodName: string;
  readonly paymentMethodType: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'OTHER';
  readonly amountPaid: number;
  readonly currency: string;
  readonly reference: string | null;
}
