/**
 * @fileoverview Primitivas serializables compartidas del módulo Banking.
 * Se usan en schemas, responses y en el dominio del backend.
 */

import type {
  CounterpartyTypeValue,
  MatchOriginValue,
  ReconciliationRuleActionValue,
  TransactionSourceTypeValue,
} from '../constants';

/** Configuración de tarjeta de crédito (solo cuentas kind=CREDIT_CARD). */
export interface CreditCardConfigPrimitives {
  /** Día de corte del estado de cuenta (1-31). */
  readonly cutoffDay?: number | null;
  /** Día límite de pago (1-31). */
  readonly paymentDay?: number | null;
  /** Límite de crédito otorgado. */
  readonly creditLimit?: number | null;
}

/** Contraparte de un movimiento (proveedor, cliente, empleado u otro). */
export interface CounterpartyPrimitives {
  readonly type: CounterpartyTypeValue;
  /** Id del tercero cuando existe en el sistema (Supplier/Customer/User). */
  readonly id?: string | null;
  /** Nombre visible de la contraparte. */
  readonly name: string;
}

/** Documento de negocio que originó el movimiento. */
export interface TransactionSourcePrimitives {
  readonly type: TransactionSourceTypeValue;
  /** Id del documento origen (copia nube); uuid suelto, sin FK. */
  readonly id?: string | null;
}

// ── N2 · Conciliación ──────────────────────────────────────────────

/**
 * Una línea tal como viene del banco, ya extraída del archivo.
 *
 * Es la salida del puerto de extracción y la entrada del importador: el dominio
 * no sabe si vino de un PDF, de una foto o de un CSV.
 */
export interface ExtractedStatementLinePrimitives {
  /** Fecha de la operación (YYYY-MM-DD). */
  readonly date: string;
  /** Texto del banco, tal cual. Es el insumo de las reglas. */
  readonly description: string;
  /** Referencia bancaria si el estado la trae. */
  readonly reference?: string | null;
  /** Monto con signo: + abono, − cargo. */
  readonly amount: number;
}

/**
 * Lo que devuelve un extractor de estados de cuenta, sea cual sea el proveedor.
 *
 * Trae los saldos declarados **además** de las líneas porque son el verificador:
 * `saldo inicial + Σ montos = saldo final`. Si no cuadra al centavo la extracción
 * se rechaza, y es lo que permite escalar de un modelo barato a uno caro sin
 * arriesgar la contabilidad.
 */
export interface StatementExtractionPrimitives {
  /** Saldo inicial declarado por el banco. */
  readonly openingBalance: number;
  /** Saldo final declarado por el banco. */
  readonly closingBalance: number;
  /** Inicio del periodo (YYYY-MM-DD). */
  readonly periodStart: string;
  /** Fin del periodo (YYYY-MM-DD). */
  readonly periodEnd: string;
  /** Movimientos en el orden en que aparecen en el documento. */
  readonly lines: readonly ExtractedStatementLinePrimitives[];
}

/**
 * Resultado de una corrida de extracción, con la trazabilidad de qué la produjo.
 *
 * `balanced` es la verdad aritmética, no una opinión del modelo: lo calcula el
 * dominio comparando los saldos declarados contra la suma de las líneas.
 */
export interface StatementExtractionAttemptPrimitives {
  /** Identificador del proveedor/modelo que la produjo, para auditoría y costo. */
  readonly extractor: string;
  /** Si la ecuación de saldos cuadró al centavo. */
  readonly balanced: boolean;
  /** Diferencia encontrada (0 cuando cuadra). Útil para mostrar el descuadre. */
  readonly difference: number;
  readonly extraction: StatementExtractionPrimitives;
}

/** Condición de una regla de conciliación sobre una línea del banco. */
export interface ReconciliationMatchPrimitives {
  /** La descripción del banco debe contener este texto (case-insensitive). */
  readonly descriptionContains: string;
  /** Signo exigido: IN = abono, OUT = cargo. Null = cualquiera. */
  readonly sign?: 'IN' | 'OUT' | null;
  /** Monto mínimo en valor absoluto. */
  readonly amountMin?: number | null;
  /** Monto máximo en valor absoluto. */
  readonly amountMax?: number | null;
}

/** Desglose que produce el split TPV sobre una línea del banco (spec §6). */
export interface TpvSplitPrimitives {
  /** Venta bruta con tarjeta del lote. */
  readonly grossAmount: number;
  /** Comisión de la terminal (sin IVA). */
  readonly commissionAmount: number;
  /** IVA de la comisión — acreditable, por eso va separado. */
  readonly commissionTaxAmount: number;
  /** Cortes de caja que cubre el lote. */
  readonly cashClosureIds: readonly string[];
}

/** Por qué se propuso un emparejamiento, para poder auditarlo. */
export interface MatchSuggestionPrimitives {
  readonly origin: MatchOriginValue;
  /** Movimientos existentes que se proponen ligar. */
  readonly transactionIds: readonly string[];
  /** Regla que disparó la sugerencia, cuando el origen es RULE. */
  readonly ruleId?: string | null;
  /** Categoría propuesta cuando hay que crear el movimiento. */
  readonly categoryId?: string | null;
  /** Desglose propuesto cuando el origen es TPV_SETTLEMENT. */
  readonly tpvSplit?: TpvSplitPrimitives | null;
  /** Diferencia en centavos entre la línea y lo propuesto (0 = exacto). */
  readonly differenceCents: number;
}

/** Acción de una regla, ya resuelta. */
export interface ReconciliationActionPrimitives {
  readonly type: ReconciliationRuleActionValue;
  /** Categoría a aplicar cuando la acción es SET_CATEGORY. */
  readonly categoryId?: string | null;
  /** Tasa de comisión propuesta para TPV_SPLIT (fracción: 0.025 = 2.5%). */
  readonly commissionRate?: number | null;
}
