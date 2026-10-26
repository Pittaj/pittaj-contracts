/**
 * @fileoverview B2 · Un cobro a cliente visto desde el depósito que lo pudo haber traído.
 * @module CustomerPaymentCandidateResponse
 *
 * Bancos no es dueño del cobro: es de cobranza (`customer_payments`). Lo que aporta es cuánto de él
 * ya está explicado por depósitos, derivado de las conciliaciones — nunca escrito en el cobro.
 */

export interface CustomerPaymentCandidateResponse {
  readonly customerPaymentId: string;
  readonly folio: string;
  readonly customerId: string;
  readonly customerName: string | null;
  readonly amount: number;
  /** `YYYY-MM-DD` del cobro. */
  readonly date: string;
  /** CASH / CARD / TRANSFER / OTHER, tal como lo registró cobranza. */
  readonly paymentMethodType: string | null;
  /** `PUE:<uuid>` en los que nacieron de una factura de otro sistema (D1). */
  readonly reference: string | null;
  /** Lo que de este cobro ya traen OTROS depósitos. */
  readonly linkedElsewhere: number;
  /** Lo que de este cobro trae ESTE depósito (0 si no está vinculado). */
  readonly linkedHere: number;
  /** `amount − linkedElsewhere`: lo que este depósito todavía puede explicar del cobro. */
  readonly available: number;
}
