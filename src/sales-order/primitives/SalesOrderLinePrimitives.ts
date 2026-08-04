import type { SaleLineBasePrimitives } from '../../shared/index.js';

export interface SalesOrderLinePrimitives extends SaleLineBasePrimitives {
  readonly notes: string | null;
}
