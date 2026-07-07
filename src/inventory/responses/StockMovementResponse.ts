/**
 * @fileoverview DTO de respuesta para StockMovement (sync).
 *
 * Espejo del StockMovementDto desktop (entrada del ledger de existencias,
 * APPEND-ONLY: un error se corrige con un movimiento inverso, no editando). La nube
 * es RELAY: guarda el movimiento tal cual (round-trip 1:1) sin recalcular
 * existencias. Entidad PLANA (sin hijos). La cantidad va en unidad base.
 *
 * @module Contracts/Inventory
 */

/** Dirección del movimiento: IN (entrada) | OUT (salida). */
export type MovementDirection = 'IN' | 'OUT';

/**
 * Origen del movimiento (trazabilidad + contabilidad).
 * MERMA = salida por desperdicio/pérdida (separado de ADJUSTMENT para reportar
 * merma por producto). PRODUCTION = transformación (orden de producción).
 */
export type StockSourceType =
    | 'SALE'
    | 'RETURN'
    | 'PURCHASE'
    | 'PURCHASE_RETURN'
    | 'TRANSFER'
    | 'ADJUSTMENT'
    | 'COUNT'
    | 'INITIAL'
    | 'MERMA'
    | 'PRODUCTION';

/** DTO de respuesta para consultas/sync de movimientos de existencias. */
export interface StockMovementResponse {
    readonly id: string;
    /** Producto (soft ref al catálogo). */
    readonly productId: string;
    /** Bodega (soft ref al catálogo de bodegas). */
    readonly warehouseId: string;
    readonly direction: MovementDirection;
    /** Cantidad en unidad base (> 0). */
    readonly quantity: number;
    /** Costo unitario del movimiento. */
    readonly unitCost: number;
    readonly sourceType: StockSourceType;
    /** Folio del documento origen (soft ref; null = sin origen). */
    readonly sourceDocId: string | null;
    /** Cajero/usuario que originó el movimiento (null = sin capturar). */
    readonly userId: string | null;
    /** Momento del movimiento (ISO 8601). */
    readonly occurredAt: string;
    /** Sucursal (scoping denormalizado; null = general; soft ref). */
    readonly locationId: string | null;

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
