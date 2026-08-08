/**
 * @fileoverview Response DTO canónico de TransactionCategory
 * @module TransactionCategoryResponse
 * @version 1.0.0
 */

export interface TransactionCategoryResponse {
  readonly id: string;
  /**
   * Código estable de la categoría de sistema (`DEPOSITO_VENTA`, `OTRO`…), o `null` si la creó
   * el usuario.
   *
   * **Es la identidad; el nombre es la etiqueta.** Quien tenga que reconocer una categoría
   * concreta —el ajuste de centavos, el traspaso, el mapeo contable— mira esto y nunca el nombre:
   * el nombre es texto visible y el día que se traduzca o se renombre, lo que dependa de él deja
   * de encontrarla sin dar un error que hable de nombres.
   */
  readonly code: string | null;
  /** Nombre visible, único por tenant ("Depósito de venta", "Gasto"…). */
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
