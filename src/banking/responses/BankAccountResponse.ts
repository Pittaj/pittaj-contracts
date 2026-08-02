/**
 * @fileoverview Response DTO canónico de BankAccount
 * @module BankAccountResponse
 * @version 1.0.0
 */

import type { CreditCardConfigPrimitives } from '../primitives';

export interface BankAccountResponse {
  readonly id: string;
  readonly name: string;
  /** BANK / CASH / CREDIT_CARD / PSP / TRANSIT (sistema). */
  readonly kind: string;
  readonly bankName: string | null;
  readonly accountNumber: string | null;
  readonly clabe: string | null;
  readonly currency: string;
  readonly openingBalance: number;
  /** Fecha ISO (YYYY-MM-DD); no se admiten movimientos anteriores. */
  readonly openingDate: string;
  readonly locationId: string | null;
  /** Cuenta contable — campo dormido hasta Contabilidad. */
  readonly ledgerAccountCode: string | null;
  /** Configuración TDC; solo kind=CREDIT_CARD. */
  readonly creditCard: CreditCardConfigPrimitives | null;
  /** Cuenta creada por el sistema (TRANSIT): oculta y no editable. */
  readonly isSystem: boolean;
  readonly status: string;
  /**
   * Saldo actual según libros: openingBalance + Σ(IN − OUT) de movimientos
   * no VOID. Derivado por query (SUM en SQL), nunca columna almacenada.
   */
  readonly currentBalance: number;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly updatedAt: Date | null;
  readonly updatedBy: string | null;
  readonly version: number;
}
