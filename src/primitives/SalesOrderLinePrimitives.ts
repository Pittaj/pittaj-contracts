import type { SaleLineBasePrimitives } from './SaleLineBasePrimitives';

export interface SalesOrderLinePrimitives extends SaleLineBasePrimitives {
  readonly notes: string | null;
}
