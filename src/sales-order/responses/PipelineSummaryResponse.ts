/**
 * @fileoverview Response DTO para el resumen de pipeline
 * @module PipelineSummaryResponse
 * @version 1.0.0
 */

/**
 * Resumen del pipeline de ordenes de venta.
 */
export interface PipelineSummaryResponse {
  /** Conteo de ordenes por estado. */
  readonly statusCounts: Record<string, number>;

  /** Total de ordenes activas. */
  readonly totalActive: number;

  /** Monto total del pipeline activo. */
  readonly totalAmount: number;

  /** Saldo pendiente total. */
  readonly totalBalance: number;
}
