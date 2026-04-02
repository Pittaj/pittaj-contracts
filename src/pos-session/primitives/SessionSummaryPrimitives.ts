export interface SessionSummaryPrimitives {
  readonly totalSales: number;
  readonly totalRefunds: number;
  readonly totalCashIn: number;
  readonly totalCashOut: number;
  readonly netCash: number;
  readonly transactionCount: number;
  readonly refundCount: number;
  readonly averageTicket: number;
  readonly currency: string;
}
