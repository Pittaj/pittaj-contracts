import type { SalePaymentBasePrimitives } from '../../shared/index.js';

export interface PosTicketPaymentPrimitives extends SalePaymentBasePrimitives {
  readonly changeAmount: number;

  /**
   * Quién autorizó fiar POR ENCIMA de la línea de crédito. `null` = no hizo falta.
   *
   * Solo se llena en pagos crediticios que se pasaron del límite (BUG-030). Sin este sello, el
   * permiso se comprueba y se olvida: no quedaría forma de saber quién dejó pasar qué.
   */
  readonly creditAuthorizedBy?: string | null;

  /**
   * El saldo que el guardia **creyó** que el cliente debía al aceptar este pago.
   *
   * Puede haber sido incorrecto: sin red la caja calcula contra lo que tiene, y le pueden faltar
   * cobros hechos en otro lado. Comparar este número con el saldo real, ya sincronizado, dice qué
   * ventas se autorizaron sobre datos viejos.
   */
  readonly creditBalanceSeen?: number | null;
}
