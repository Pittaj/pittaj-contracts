export interface SalePaymentBasePrimitives {
  readonly id: string;
  readonly paymentMethodId: string;
  readonly paymentMethodName: string;
  /** `CREDIT_NOTE` (C4): pago con una nota de crédito; la póliza del corte lo lleva a 206-02. */
  readonly paymentMethodType: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'OTHER' | 'ADVANCE' | 'CREDIT_NOTE';
  // ADVANCE (D7h1): la aplicación del anticipo con que se liquida un apartado; no es dinero en caja.
  readonly amountPaid: number;
  readonly currency: string;
  readonly reference: string | null;
}
