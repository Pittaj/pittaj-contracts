import type { SalePaymentBasePrimitives } from './SalePaymentBasePrimitives';

export interface SalesOrderPaymentPrimitives extends SalePaymentBasePrimitives {
  readonly dueDate: Date | null;
}
