/**
 * Un renglón del conteo físico de efectivo: cuántas piezas hay de una denominación.
 *
 * NO lleva el importe del renglón ni el total contado. Son `denomination * pieces`
 * y su suma, y una cantidad acumulada que se guarda es una cantidad que puede
 * discrepar de sus partes (§4 del mandato de paridad). Aquí el riesgo es concreto:
 * un total que no cuadre con su desglose deja un arqueo que nadie puede recontar.
 *
 * La moneda no viaja por renglón: es la del cierre, igual que en los resúmenes por
 * método (el agregado no admite mezclar monedas).
 */
export interface CashClosureDenominationPrimitives {
  /** Valor facial de la pieza: 500, 200, 0.50… Siempre positivo. */
  readonly denomination: number;
  /** Piezas contadas de esa denominación. 0 es válido (se contó y no había). */
  readonly pieces: number;
}
