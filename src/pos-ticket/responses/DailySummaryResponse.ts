/**
 * @fileoverview Response DTO para GetDailySummary query
 * @module queries/get-daily-summary
 * @version 1.0.0
 */

/**
 * Response DTO para resumen diario de ventas POS.
 *
 * @interface DailySummaryResponse
 * @since 1.0.0
 */
export interface DailySummaryResponse {
  /** Fecha del resumen (formato YYYY-MM-DD). */
  readonly date: string;

  /** Cantidad de tickets completados en el dia. */
  readonly ticketCount: number;

  /** Monto total de ventas del dia. */
  readonly totalAmount: number;

  /** Total de articulos vendidos. */
  readonly totalItems: number;

  /** Moneda. */
  readonly currency: string;
}
