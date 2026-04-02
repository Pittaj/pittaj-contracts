import type { SalePaymentBasePrimitives } from '../../shared';

export interface PosTicketPaymentPrimitives extends SalePaymentBasePrimitives {
  readonly changeAmount: number;
}
