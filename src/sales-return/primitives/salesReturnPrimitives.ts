/**
 * @fileoverview Primitivas del dominio Devolución de venta (SalesReturn).
 * @module Contracts/SalesReturn/Primitives
 *
 * Espejo del agregado desktop Pittaj.Domain.SalesReturn.SalesReturn (ADR-007): documento
 * de egreso propio, ligado al ticket origen. Reingresa inventario y se resuelve en efectivo
 * (CASH) o nota de crédito (CREDIT_NOTE). Fuente única de los valores de enum del dominio.
 */

/** Cómo se resuelve el importe de la devolución (espejo de ReturnResolution del desktop). */
export const RETURN_RESOLUTIONS = ['CASH', 'CREDIT_NOTE'] as const;

/** Resolución del importe: efectivo (CASH_OUT en caja) o nota de crédito (saldo a favor). */
export type ReturnResolutionPrimitive = (typeof RETURN_RESOLUTIONS)[number];
