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

/**
 * Un abono del cliente, como entidad.
 *
 * Antes el apartado solo guardaba **cuánto** llevaba pagado (`paid`, un escalar) y no los
 * pagos: sin fecha, sin método y sin id, un abono no era un documento y **no se podía
 * contabilizar** — el único rastro era un movimiento de caja `DEPOSIT`, que el escritorio usa
 * también para meter cambio al cajón, con asiento contrario.
 *
 * Con esto el abono es un anticipo del cliente contra una cuenta de pasivo (`206-01`), y
 * `DEPOSIT` recupera su único significado.
 */
export interface LayawayPaymentPrimitives {
    readonly id: string;
    readonly layawayId: string;
    /** Importe del abono. Siempre > 0. */
    readonly amount: number;
    /** Forma de pago con la que abonó. Null = no se registró (abonos anteriores al cambio). */
    readonly paymentMethodId: string | null;
    readonly paymentMethodName: string | null;
    /** Sesión de caja donde se asentó. */
    readonly sessionId: string | null;
    /** Cuándo abonó, en ISO 8601. */
    readonly occurredAt: string;
    readonly operatorId: string | null;
}
