import type { SaleLineBasePrimitives } from '../../shared';

export interface PosTicketLinePrimitives extends SaleLineBasePrimitives {
  readonly notes: string | null;
}
