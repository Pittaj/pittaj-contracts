/**
 * @fileoverview Response DTO canónico de BankTransfer
 * @module BankTransferResponse
 * @version 1.0.0
 */

import type { BankTransactionResponse } from './BankTransactionResponse.js';

export interface BankTransferResponse {
  readonly id: string;
  readonly fromAccountId: string;
  readonly toAccountId: string;
  readonly amount: number;
  readonly currency: string;
  /** Fecha ISO (YYYY-MM-DD). */
  readonly date: string;
  readonly notes: string | null;
  /**
   * Las dos piernas del traspaso vía cuenta puente: OUT en la cuenta origen
   * e IN en la destino (nacen juntas, atómicamente).
   */
  readonly legs: readonly BankTransactionResponse[];
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly version: number;
}
