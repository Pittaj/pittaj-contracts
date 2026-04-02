export interface ClosingBalancePrimitives {
  readonly expectedAmount: number;
  readonly actualAmount: number;
  readonly difference: number;
  readonly currency: string;
}
