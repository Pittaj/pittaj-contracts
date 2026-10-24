/**
 * @fileoverview F3.4 · Response y aritmética de la liquidación de una pasarela.
 * @module PspSettlementResponse
 */

import type { BankTransactionResponse } from './BankTransactionResponse.js';

export interface PspSettlementResponse {
  readonly id: string;
  /** La cuenta `PSP` donde quedó el dinero. */
  readonly accountId: string;
  /** Fecha ISO (YYYY-MM-DD). */
  readonly date: string;
  readonly grossAmount: number;
  readonly commissionAmount: number;
  readonly commissionTaxAmount: number;
  /** Lo que la pasarela abonó al saldo: bruto − comisión − IVA. Derivado, no se guarda. */
  readonly netAmount: number;
  readonly reference: string | null;
  /** Las tres patas, en orden: IN bruto, OUT comisión, OUT IVA (la que valga cero no existe). */
  readonly transactions: readonly BankTransactionResponse[];
}

/**
 * Parte lo que se quedó la pasarela (`bruto − neto`) en comisión e IVA de la comisión.
 *
 * Es la **derivación exacta** del TPV (`bank-reconciliation.md` §6): el dato duro es lo que la
 * pasarela abonó, no la tasa pactada. `deducción = comisión · (1 + iva)`, y el IVA absorbe el
 * redondeo para que las tres cifras cierren al centavo. La misma cuenta en la pantalla, en el puente
 * y en `TpvSplitCalculator.fromKnownGross` del backend.
 */
export function desgloseDeLaLiquidacion(
  grossAmount: number,
  netAmount: number,
  taxRate = 0.16,
): { grossAmount: number; commissionAmount: number; commissionTaxAmount: number; netAmount: number } {
  const c = (v: number) => Math.round(v * 100);
  const deduccion = c(grossAmount) - c(netAmount);
  const comision = Math.round(deduccion / (1 + taxRate));
  return {
    grossAmount: c(grossAmount) / 100,
    commissionAmount: comision / 100,
    commissionTaxAmount: (deduccion - comision) / 100,
    netAmount: c(netAmount) / 100,
  };
}
