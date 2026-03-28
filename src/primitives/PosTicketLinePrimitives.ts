import type { SaleLineBasePrimitives } from './SaleLineBasePrimitives';

export interface PosTicketLinePrimitives extends SaleLineBasePrimitives {
  readonly notes: string | null;
}
