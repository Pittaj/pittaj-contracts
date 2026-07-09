/**
 * @fileoverview Primitivas del dominio Apartado (Layaway).
 * @module Contracts/Layaway/Primitives
 *
 * Espejo del agregado desktop Pittaj.Domain.Layaway.Layaway (ADR-007): documento propio.
 * Los abonos son ANTICIPOS (CASH_IN/DEPOSIT en la sesión), no ingreso, hasta liquidar. Al
 * liquidar (saldo 0) marca COMPLETED y descuenta inventario (OUT/SALE); la emisión del ticket
 * formal/CFDI queda como paso siguiente (ADR-007) — el desktop NO la emite, la nube tampoco.
 * Fuente única de los valores de enum del dominio.
 */

/** Estados del apartado (espejo de LayawayStatus del desktop). OPEN → COMPLETED/CANCELLED/EXPIRED. */
export const LAYAWAY_STATUSES = ['OPEN', 'COMPLETED', 'CANCELLED', 'EXPIRED'] as const;

/** Estado del apartado. Solo los OPEN admiten abono / liquidación / cancelación. */
export type LayawayStatusPrimitive = (typeof LAYAWAY_STATUSES)[number];
