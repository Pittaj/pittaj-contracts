/**
 * @fileoverview Respuestas del resultado operativo diario.
 * @module operating-result/responses
 *
 * Es la pestaña 1 del Excel del dueño: **qué vendí, qué me costó y qué me
 * quedó**, día por día, con el acumulado del periodo a la derecha.
 *
 * ── Por qué no es el Estado de Resultados de Contabilidad ──
 *
 * Aquel sale de las pólizas, es mensual y exige el add-on administrativo. Este
 * se deriva de los documentos que ya existen —tickets, kardex y movimientos de
 * tesorería—, es **diario** y va en el plan base: el dueño que solo tiene
 * operación tiene que poder ver su utilidad del día.
 *
 * Los dos deben cuadrar al cierre del mes; si no lo hacen, manda el contable.
 */

/** Un día del periodo. */
export interface OperatingResultDayResponse {
  /** YYYY-MM-DD. */
  readonly date: string;

  /**
   * Ventas **netas de impuestos** (base gravable: subtotal − descuentos).
   *
   * Es la cifra comparable con el costo, que también viene neto. Mezclar una
   * venta con IVA contra un costo sin él infla el margen entre 8 y 16 puntos
   * sin que nada avise.
   */
  readonly netSales: number;

  /**
   * Lo que de verdad entró a la caja (con impuestos).
   *
   * Viaja aparte para que el dueño pueda cuadrar contra su corte, que es en
   * esta cifra en la que piensa cuando dice «hoy vendí tanto».
   */
  readonly grossSales: number;

  /** Costo de la mercancía vendida, en positivo. */
  readonly costOfGoods: number;

  /** `netSales − costOfGoods`. */
  readonly grossProfit: number;

  /** Gastos del periodo, en positivo. */
  readonly expenses: number;

  /** `grossProfit − expenses`. La cifra que de verdad importa. */
  readonly operatingProfit: number;

  /**
   * Cuántos tickets cerrados tuvo el día.
   *
   * Distingue «no vendí» de «no hay datos»: un día con 0 tickets y $0 es un
   * domingo cerrado; un día sin fila es el futuro.
   */
  readonly ticketCount: number;

  /**
   * false = el día todavía no ha ocurrido (o va a medias).
   *
   * La pantalla lo pinta con raya y no con cero: un cero dice «no vendí», que
   * en la semana en curso es mentira.
   */
  readonly hasData: boolean;
}

/**
 * F1.6 · El periodo de UNA línea de negocio.
 *
 * Ventas y costo salen de los renglones (la línea estampada en el ticket y la del producto en
 * el kardex), así que un ticket con frijol y bolillo reparte su venta entre abarrotes y
 * panadería. Los gastos siguen a la línea de la cuenta de banco que los pagó (F7.4); lo que
 * sale de una cuenta sin línea cae en el renglón sin línea.
 */
export interface OperatingResultLineResponse {
  /** null = sin línea (productos sin línea, cuentas sin asignar). */
  readonly businessLineId: string | null;
  readonly name: string;
  readonly netSales: number;
  readonly grossSales: number;
  readonly costOfGoods: number;
  readonly grossProfit: number;
  readonly expenses: number;
  readonly operatingProfit: number;
  /** Tickets que tienen al menos un renglón de la línea: uno mixto cuenta en las dos. */
  readonly ticketCount: number;
  /** Null si la línea no vendió (mismo criterio que el del periodo). */
  readonly grossMarginPct: number | null;
}

/** El periodo completo con su acumulado. */
export interface OperatingResultResponse {
  readonly from: string;
  readonly to: string;

  /** TODOS los días del rango, incluidos los que aún no tienen datos. */
  readonly days: readonly OperatingResultDayResponse[];

  /** Suma del periodo. `hasData` y `ticketCount` agregan igual que el resto. */
  readonly total: OperatingResultDayResponse;

  /**
   * Margen bruto del periodo, en porcentaje. **Null si no hubo ventas.**
   *
   * Null y no cero: un 0 % afirma que se vendió sin margen, y eso es una
   * afirmación distinta de «no se vendió». Mismo criterio que la tasa de
   * comisión del reporte de terminal.
   */
  readonly grossMarginPct: number | null;

  /** Último día con datos; los posteriores son futuro. */
  readonly completeThrough: string | null;

  readonly currency: string;

  /**
   * F1.6 · El acumulado del periodo partido por línea de negocio. Vacío si el negocio no usa
   * líneas. La suma de las líneas da el total, salvo `ticketCount` (un ticket mixto cuenta en
   * cada línea que toca).
   */
  readonly byLine: readonly OperatingResultLineResponse[];
}
