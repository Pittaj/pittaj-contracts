/**
 * @fileoverview DTO de respuesta para StockMovement (sync).
 *
 * Espejo del StockMovementDto desktop (entrada del ledger de existencias,
 * APPEND-ONLY: un error se corrige con un movimiento inverso, no editando). Viaja en las
 * dos direcciones tal cual (round-trip 1:1) y es LA VERDAD del inventario: cada punta
 * deriva de él su existencia (F2.1). Entidad PLANA (sin hijos). Cantidad en unidad base.
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
    /**
     * Nombre del producto resuelto en la nube (proyección de lectura acotada a la
     * página; null = producto no encontrado). NO viaja en el round-trip de sync
     * (el desktop ignora este campo enriquecido).
     */
    readonly productName: string | null;
    /** Código del producto resuelto en la nube (null = no encontrado). */
    readonly productCode?: string | null;
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

    /**
     * Rastreo (1.18.0, opcional hasta que las dos puntas lo escriban). Un movimiento nombra a lo
     * sumo UN lote: una salida que toma de dos lotes se escribe como dos movimientos con el mismo
     * `sourceDocId`. Las series van en el movimiento y su número es igual a `quantity`.
     */
    readonly lotId?: string | null;
    readonly lotNumber?: string | null;
    readonly serialNumbers?: readonly string[] | null;
    /**
     * Lectura: saldo de la pareja producto×bodega después de este movimiento (kárdex con saldo
     * corrido). Solo lo llena `GET /api/stock-movements?withBalance=true` con `productId`.
     */
    readonly balanceAfter?: number;

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
