/**
 * @fileoverview Los tres reportes de tesorería.
 * @module BankReportResponses
 * @version 1.0.0
 *
 * Los tres son **proyecciones de solo lectura**: nada de aquí se guarda. Se derivan de los
 * movimientos, las cuentas, las categorías y los estados de cuenta que ya existen, que es la misma
 * razón por la que no hubo migración — un reporte que necesita su propia tabla es un reporte que
 * puede desincronizarse del libro que dice resumir.
 */

/** Una cuenta en el reporte de saldos. */
export interface AccountBalanceRow {
  readonly accountId: string;
  readonly accountName: string;
  /** `BANK` / `CASH` / `CREDIT_CARD` / `PSP`. */
  readonly kind: string;
  readonly currency: string;
  readonly locationName: string | null;

  /**
   * Saldo según nuestros libros: apertura + Σ(entradas − salidas) de los movimientos no anulados.
   * Se deriva siempre, nunca se guarda (`bank-account.md`).
   */
  readonly bookBalance: number;

  /**
   * Hasta dónde llega lo confirmado por el banco. `null` = esta cuenta **nunca se ha conciliado**,
   * que no es lo mismo que estar al corriente y por eso no se rellena con la fecha de hoy.
   */
  readonly reconciledThrough: string | null;
  /** Saldo final del último estado de cuenta cerrado. `null` si no hay ninguno. */
  readonly bankBalance: number | null;

  /**
   * Lo que los libros ya movieron y el banco todavía no confirma, **después** del cierre.
   * Es el término que hace que la ecuación de la conciliación cierre (`bank-reconciliation.md`
   * §4.1): banco + depósitos en tránsito − cargos en tránsito = libros.
   */
  readonly inTransit: number;

  /**
   * Lo que sobra de esa ecuación. Cero = cuadra. Distinto de cero significa que hay movimientos
   * conciliados que no cuadran con el estado, y ahí es donde hay que mirar.
   *
   * `null` cuando la cuenta no tiene conciliación: sin un saldo del banco no hay nada contra qué
   * restar, y un cero fabricado se leería como «cuadra».
   */
  readonly difference: number | null;

  /** Días para el pago de la tarjeta, cuando la cuenta es de crédito y tiene fechas capturadas. */
  readonly creditCardDueInDays: number | null;
  readonly creditCardDueDate: string | null;
}

export interface AccountBalancesReportResponse {
  readonly asOf: string;
  readonly rows: readonly AccountBalanceRow[];
  /**
   * Suma de los saldos en libros **excluyendo las tarjetas de crédito**.
   *
   * Una tarjeta es deuda, no disponible: sumarla haría que un adeudo grande **subiera** lo que
   * parece que tienes, que es el peor error que puede cometer una cifra que se mira para decidir
   * si se puede pagar algo hoy.
   */
  readonly totalAvailable: number;
  readonly totalInTransit: number;
  /** Adeudo total de las tarjetas, aparte y en positivo. */
  readonly totalCardDebt: number;
  /** Cuentas que nunca se han conciliado. */
  readonly neverReconciled: number;
}

/** Una categoría en el reporte por categoría. */
export interface CategoryTotalsRow {
  readonly categoryId: string;
  /** Código estable de la categoría de sistema; `null` si la creó el usuario. */
  readonly categoryCode: string | null;
  readonly categoryName: string;
  /** Cuenta contable asignada. `null` = los movimientos de esta categoría **no se contabilizan**. */
  readonly ledgerAccountCode: string | null;
  readonly movementCount: number;
  readonly totalIn: number;
  readonly totalOut: number;
  /** `totalIn − totalOut`. */
  readonly net: number;
}

export interface CategoryTotalsReportResponse {
  readonly from: string;
  readonly to: string;
  readonly rows: readonly CategoryTotalsRow[];
  readonly totalIn: number;
  readonly totalOut: number;
  readonly net: number;
  /**
   * Movimientos cuya categoría no tiene cuenta contable y **no es `OTRO`**.
   *
   * `OTRO` se excluye a propósito: está sin cuenta por decisión —es el cajón de «no sé qué es
   * esto»— y contarla aquí convertiría una decisión en una alarma permanente que se aprende a
   * ignorar. Lo que este número cuenta es trabajo de configuración pendiente.
   */
  readonly unpostedMovements: number;
}

/** Un mes de una cuenta en el reporte de comisiones. */
export interface CommissionRow {
  /** `YYYY-MM`. */
  readonly month: string;
  readonly accountId: string;
  readonly accountName: string;
  /**
   * Venta bruta con tarjeta del periodo en esa cuenta, tomada de las liquidaciones de terminal.
   *
   * `null` cuando no hubo ninguna: una comisión de manejo de cuenta no tiene venta detrás, y
   * fabricarle un cero convertiría su tasa en una división entre cero.
   */
  readonly grossCardSales: number | null;
  readonly commission: number;
  /** El IVA de la comisión, aparte porque **es acreditable**: no es lo que cuesta cobrar. */
  readonly commissionTax: number;
  /**
   * Comisión ÷ venta bruta, en fracción (0.0271 = 2.71 %). `null` sin venta bruta que la respalde.
   *
   * Es la cifra que no está impresa en ningún estado de cuenta —el banco deposita un neto— y la
   * única con la que se puede renegociar una tarifa.
   */
  readonly impliedRate: number | null;
  /**
   * Cambio de la tasa contra el mes anterior **de la misma cuenta**, en puntos porcentuales.
   * `null` si falta alguno de los dos meses. No se compara contra un promedio de cuentas: cada
   * terminal tiene su tarifa y promediarlas escondería justo el cambio que interesa.
   */
  readonly rateChangePoints: number | null;
}

export interface CommissionsReportResponse {
  readonly from: string;
  readonly to: string;
  readonly rows: readonly CommissionRow[];
  readonly totalCommission: number;
  readonly totalTax: number;
  /** Tasa del periodo completo: Σ comisión ÷ Σ venta bruta. `null` si no hubo venta bruta. */
  readonly averageRate: number | null;
}
