/**
 * @fileoverview Response DTOs de la programación de pagos (Bancos N4).
 * @module banking/responses/ScheduledPayment
 */

import type { ScheduledPaymentPrimitives } from '../primitives/index.js';

/** Una obligación con los nombres ya resueltos para la pantalla. */
export interface ScheduledPaymentResponse extends ScheduledPaymentPrimitives {
  /** Nombre de la categoría — evita una segunda llamada por renglón. */
  readonly categoryName: string;
  /** Nombre de la cuenta prevista; null cuando no se ha elegido. */
  readonly bankAccountName: string | null;
}

/**
 * Un día del calendario, con su total y sus renglones.
 *
 * Se devuelven **solo los días con algo**: un mes vacío son 30 objetos que
 * dicen cero, y el cliente sabe pintar la rejilla completa a partir del rango.
 */
export interface PaymentCalendarDayResponse {
  /** YYYY-MM-DD. */
  readonly date: string;
  /** Suma de las obligaciones del día que no están canceladas. */
  readonly totalAmount: number;
  /** Cuántas obligaciones vivas tiene el día. */
  readonly count: number;
  /**
   * Estado del día, para pintar la celda de un color sin abrirla: el **peor**
   * de sus renglones (`OVERDUE` > `PENDING` > `SETTLED`).
   */
  readonly worstState: string;
  readonly items: readonly ScheduledPaymentResponse[];
}

/** Respuesta del calendario para un rango de fechas. */
export interface PaymentCalendarResponse {
  readonly from: string;
  readonly to: string;
  /** Solo los días con obligaciones, ordenados por fecha. */
  readonly days: readonly PaymentCalendarDayResponse[];
  /** Suma de todo lo no cancelado del rango. */
  readonly totalAmount: number;
  readonly currency: string;
}

/** Un punto de la curva de saldo proyectado. */
export interface CashProjectionPointResponse {
  readonly date: string;
  /** Salidas programadas de ese día (positivo). */
  readonly outflow: number;
  /** Entradas esperadas de ese día (positivo). Cero hasta F3. */
  readonly inflow: number;
  /** Saldo al cierre del día. Puede ser negativo: es el dato que importa. */
  readonly closingBalance: number;
}

/**
 * Proyección de caja para un horizonte.
 *
 * `crossesZeroOn` es la respuesta a la única pregunta de la pantalla —
 * *¿me alcanza, y hasta cuándo?*— y por eso viaja resuelta y no se deja que
 * el cliente la busque recorriendo los puntos.
 */
export interface CashProjectionResponse {
  readonly from: string;
  readonly to: string;
  /** Saldo de partida: suma de las cuentas, **sin tarjetas de crédito**. */
  readonly openingBalance: number;
  readonly points: readonly CashProjectionPointResponse[];
  /** Primer día en que el saldo queda por debajo de cero; null si no ocurre. */
  readonly crossesZeroOn: string | null;
  /** Cuánto falta ese día (positivo). Null si no cruza. */
  readonly shortfallAmount: number | null;
  /** Día del saldo más bajo del horizonte, cruce o no. */
  readonly lowestBalanceOn: string;
  readonly lowestBalance: number;
  /** Total de salidas programadas del horizonte. */
  readonly committedOutflow: number;
  /** Cuántas obligaciones vivas lo componen. */
  readonly scheduledCount: number;
  readonly currency: string;
}
