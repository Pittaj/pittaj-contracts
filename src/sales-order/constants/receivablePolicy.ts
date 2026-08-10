/**
 * @fileoverview Cuándo un pedido se vuelve deuda.
 * @module Contracts/SalesOrder
 *
 * Es **configuración del tenant**, porque el negocio varía: un taller que fabrica sobre pedido
 * cobra cuando entrega; un distribuidor que reserva mercancía la considera vendida al confirmarse.
 *
 * **Pero el ajuste NO se lee al consultar cuentas por cobrar.** Cuando ocurre el hecho que manda,
 * el pedido se **sella** con `receivableFrom`, y cobranza lee el sello. La diferencia importa:
 *
 * - Leyendo el ajuste, cambiarlo movería **la deuda histórica**. Pasar a «al confirmar»
 *   convertiría en deuda, de golpe, todo pedido confirmado y no entregado; volver atrás la haría
 *   desaparecer. Y la antigüedad se calcularía desde una fecha distinta a la de ayer.
 * - Con el sello, cambiar el ajuste afecta **solo a pedidos nuevos**, por construcción. Y la
 *   antigüedad tiene un ancla que es una fecha, no una política reinterpretada.
 *
 * Efecto lateral bueno: **el escritorio no necesita conocer el ajuste**, porque el sello viaja
 * dentro del pedido. Un dato menos que sincronizar y una fuente menos de discrepancia.
 */

/** Clave del ajuste en `tenant_settings`. */
export const SALES_ORDER_RECEIVABLE_POLICY_KEY = 'ventas.pedido-genera-deuda';

export const SALES_ORDER_RECEIVABLE_POLICIES = ['AL_ENTREGAR', 'AL_CONFIRMAR'] as const;

export type SalesOrderReceivablePolicy = (typeof SALES_ORDER_RECEIVABLE_POLICIES)[number];

/**
 * Por omisión, **al entregar**: es cuando hay algo que cobrar. Un pedido confirmado que todavía no
 * sale del almacén es un compromiso, no un adeudo, y meterlo en la antigüedad de saldos haría que
 * alguien saliera a cobrar mercancía que aún no ha entregado.
 */
export const DEFAULT_SALES_ORDER_RECEIVABLE_POLICY: SalesOrderReceivablePolicy = 'AL_ENTREGAR';

/** El estado del pedido que dispara el sello según la política. */
export function receivableTriggerStatus(policy: SalesOrderReceivablePolicy): string {
    return policy === 'AL_CONFIRMAR' ? 'CONFIRMED' : 'DELIVERED';
}
