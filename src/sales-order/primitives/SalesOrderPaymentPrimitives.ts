import type { SalePaymentBasePrimitives } from '../../shared';

export interface SalesOrderPaymentPrimitives extends SalePaymentBasePrimitives {
  readonly dueDate: Date | null;
}
