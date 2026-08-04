import type { SalePaymentBasePrimitives } from '../../shared/index.js';

export interface PosTicketPaymentPrimitives extends SalePaymentBasePrimitives {
  readonly changeAmount: number;
}
