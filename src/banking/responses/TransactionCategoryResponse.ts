/**
 * @fileoverview Response DTO canónico de TransactionCategory
 * @module TransactionCategoryResponse
 * @version 1.0.0
 */

export interface TransactionCategoryResponse {
  readonly id: string;
  /** Nombre único por tenant ("Depósito de venta", "Gasto"…). */
  readonly name: string;
  /** IN / OUT / BOTH — valida contra la dirección del movimiento. */
  readonly flow: string;
  /** Cuenta contable — campo dormido hasta Contabilidad. */
  readonly ledgerAccountCode: string | null;
  /** Seed del sistema: no borrable. */
  readonly isSystem: boolean;
  readonly status: string;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly updatedAt: Date | null;
  readonly updatedBy: string | null;
  readonly version: number;
}
