export interface SalePaymentBasePrimitives {
  readonly id: string;
  readonly paymentMethodId: string;
  readonly paymentMethodName: string;
  readonly paymentMethodType: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'OTHER' | 'ADVANCE';
  // ADVANCE (D7h1): la aplicación del anticipo con que se liquida un apartado; no es dinero en caja.
  readonly amountPaid: number;
  readonly currency: string;
  readonly reference: string | null;
}
