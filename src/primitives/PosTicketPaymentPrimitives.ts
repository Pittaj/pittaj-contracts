import type { SalePaymentBasePrimitives } from './SalePaymentBasePrimitives';

export interface PosTicketPaymentPrimitives extends SalePaymentBasePrimitives {
  readonly changeAmount: number;
}
