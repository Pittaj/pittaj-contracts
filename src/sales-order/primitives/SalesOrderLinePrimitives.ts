import type { SaleLineBasePrimitives } from '../../shared';

export interface SalesOrderLinePrimitives extends SaleLineBasePrimitives {
  readonly notes: string | null;
}
