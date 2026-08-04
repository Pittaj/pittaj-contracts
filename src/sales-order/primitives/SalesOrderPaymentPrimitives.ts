import type { SalePaymentBasePrimitives } from '../../shared/index.js';

export interface SalesOrderPaymentPrimitives extends SalePaymentBasePrimitives {
  readonly dueDate: Date | null;
}
