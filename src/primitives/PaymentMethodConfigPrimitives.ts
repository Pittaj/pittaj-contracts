export interface PaymentMethodConfigPrimitives {
  readonly isCashCount: boolean;
  readonly requiresCustomer: boolean;
  readonly requiresReference: boolean;
  readonly commission: number;
}
