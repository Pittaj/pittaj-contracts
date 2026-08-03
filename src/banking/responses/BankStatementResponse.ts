/**
 * @fileoverview Response DTOs canónicos de BankStatement y sus líneas
 * @module BankStatementResponse
 * @version 1.0.0
 */

import type {
  MatchOriginValue,
  MatchStatusValue,
  StatementSourceValue,
  StatementStatusValue,
} from '../constants';
import type { MatchSuggestionPrimitives } from '../primitives';

/** Una línea del estado de cuenta del banco, con su estado de emparejamiento. */
export interface BankStatementLineResponse {
  readonly id: string;
  readonly statementId: string;
  /** Fecha ISO (YYYY-MM-DD). */
  readonly date: string;
  /** Texto tal como lo manda el banco. */
  readonly description: string;
  readonly reference: string | null;
  /** Monto con signo: + abono, − cargo. */
  readonly amount: number;
  readonly matchStatus: MatchStatusValue;
  /** Por qué se emparejó o se propuso (null mientras está UNMATCHED). */
  readonly matchOrigin: MatchOriginValue | null;
  /** Movimientos ligados. Soporta 1:1, 1:N y N:1 (varias líneas al mismo movimiento). */
  readonly matchedTransactionIds: readonly string[];
  /** Sugerencia vigente cuando matchStatus = SUGGESTED. */
  readonly suggestion: MatchSuggestionPrimitives | null;
  /** Orden en que apareció en el documento; conserva la lectura original. */
  readonly sequence: number;
}

/**
 * El cuadre de la conciliación (spec §4). La pantalla lo muestra vivo y el
 * cierre solo procede cuando `difference` es cero.
 */
export interface ReconciliationBalanceResponse {
  /** Saldo final que declara el banco. */
  readonly bankClosingBalance: number;
  /** Depósitos en libros que el banco todavía no refleja. */
  readonly depositsInTransit: number;
  /** Cargos en libros que el banco todavía no refleja. */
  readonly chargesInTransit: number;
  /** Saldo según libros a la fecha de corte. */
  readonly bookBalance: number;
  /** bankClosingBalance + depósitos − cargos − bookBalance. Cero = cuadra. */
  readonly difference: number;
}

export interface BankStatementResponse {
  readonly id: string;
  readonly accountId: string;
  /** Nombre de la cuenta, para no obligar a una segunda llamada. */
  readonly accountName: string;
  /** Fechas ISO (YYYY-MM-DD). */
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly openingBalance: number;
  readonly closingBalance: number;
  readonly currency: string;
  readonly source: StatementSourceValue;
  readonly status: StatementStatusValue;
  /**
   * Identificador del extractor que produjo las líneas (modelo y proveedor),
   * null si se capturaron a mano. Sirve para auditar y para medir costo.
   */
  readonly extractor: string | null;
  /** Llave en R2 del archivo original: es el soporte documental de la conciliación. */
  readonly sourceFileKey: string | null;
  readonly lines: readonly BankStatementLineResponse[];
  /** Cuántas líneas ya están MATCHED o CREATED, de cuántas en total. */
  readonly reconciledLineCount: number;
  readonly totalLineCount: number;
  readonly balance: ReconciliationBalanceResponse;
  readonly closedBy: string | null;
  readonly closedAt: Date | null;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly version: number;
}

/** Vista de listado: sin líneas, para la lista de conciliaciones de una cuenta. */
export interface BankStatementSummaryResponse {
  readonly id: string;
  readonly accountId: string;
  readonly accountName: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly closingBalance: number;
  readonly currency: string;
  readonly status: StatementStatusValue;
  readonly reconciledLineCount: number;
  readonly totalLineCount: number;
  readonly closedAt: Date | null;
  readonly createdAt: Date;
}
