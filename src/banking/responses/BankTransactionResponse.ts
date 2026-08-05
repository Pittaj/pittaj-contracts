/**
 * @fileoverview Response DTO canónico de BankTransaction
 * @module BankTransactionResponse
 * @version 1.0.0
 */

import type {
  CounterpartyPrimitives,
  PaymentApplicationPrimitives,
  TransactionSourcePrimitives,
} from '../primitives/index.js';

export interface BankTransactionResponse {
  readonly id: string;
  readonly accountId: string;
  /** Fecha valor ISO (YYYY-MM-DD): la del banco, no la de captura. */
  readonly date: string;
  /** IN / OUT — el signo lo da la dirección; amount siempre > 0. */
  readonly direction: string;
  readonly amount: number;
  /** Moneda de la cuenta. */
  readonly currency: string;
  /** Categoría obligatoria — no hay movimientos sin clasificar. */
  readonly categoryId: string;
  readonly counterparty: CounterpartyPrimitives | null;
  readonly source: TransactionSourcePrimitives;
  /** CFDIs que este pago cubre (andamiaje N3 → REP). */
  readonly cfdiUuids: readonly string[];
  /**
   * Documentos que este movimiento paga (N3). Vacío = pago sin aplicar.
   *
   * Un movimiento sin aplicaciones no es un error: el dinero salió y todavía
   * no se decide contra qué documento va. Lo que sí sería un error es que la
   * suma aplicada superara el importe del movimiento.
   */
  readonly applications: readonly PaymentApplicationPrimitives[];
  /** Importe del movimiento que aún no se aplica a ningún documento. */
  readonly unappliedAmount: number;
  readonly reference: string | null;
  readonly notes: string | null;
  /** Pierna de un traspaso, si aplica. */
  readonly transferId: string | null;
  /** Conciliación que lo confirmó (N2; null en N1). */
  readonly reconciliationId: string | null;
  /** Usuario que capturó (trazabilidad). */
  readonly userId: string;
  /** PENDING / CLEARED / VOID. */
  readonly status: string;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly updatedAt: Date | null;
  readonly updatedBy: string | null;
  readonly version: number;
}

/** Página de movimientos (GetBankTransactions). */
export interface BankTransactionPageResponse {
  readonly items: readonly BankTransactionResponse[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
