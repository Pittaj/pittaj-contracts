/**
 * @fileoverview Primitivas del dominio Devolución de venta (SalesReturn).
 * @module Contracts/SalesReturn/Primitives
 *
 * Espejo del agregado desktop Pittaj.Domain.SalesReturn.SalesReturn (ADR-007): documento
 * de egreso propio, ligado al ticket origen. Reingresa inventario y se resuelve en efectivo
 * (CASH) o nota de crédito (CREDIT_NOTE). Fuente única de los valores de enum del dominio.
 */

/**
 * Cómo se resuelve el importe de la devolución (espejo de ReturnResolution del desktop).
 *
 * Las tres se comportan distinto, y por eso son tres y no dos con una variante:
 * - `CASH` — sale del cajón (CASH_OUT/REFUND sobre la sesión).
 * - `CREDIT_NOTE` — no sale dinero: nace un saldo a favor del cliente.
 * - `TRANSFER` — sale del banco. **No toca la sesión de caja.** Mientras no existió, quien mandaba
 *   un SPEI lo capturaba como efectivo y el arqueo del turno cerraba con un sobrante exactamente de
 *   ese importe; si el cajón no tenía el efectivo, ni siquiera se podía devolver.
 */
export const RETURN_RESOLUTIONS = ['CASH', 'CREDIT_NOTE', 'TRANSFER'] as const;

/**
 * C0 de plan-caja-sin-salir · Semilla del id del movimiento de banco de un reembolso por
 * transferencia. La misma en la nube y en el escritorio (`IdDeterminista.DeSemilla`): la devolución
 * hecha en un equipo y su salida en Bancos llegan a la nube por dos syncs distintos y no se duplican.
 */
export function semillaDelReembolsoPorBanco(returnId: string): string {
    return `bank-transaction:sales-return:${returnId}`;
}

/** Folio de las devoluciones hechas en la web. Cada escritorio usa `DEV-<equipo>-`. */
export const SALES_RETURN_WEB_PREFIX = 'DEV-W-';

/** Resolución del importe: efectivo (cajón), nota de crédito (saldo a favor) o transferencia (banco). */
export type ReturnResolutionPrimitive = (typeof RETURN_RESOLUTIONS)[number];
