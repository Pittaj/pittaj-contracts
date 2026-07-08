/**
 * @fileoverview DTO de respuesta para StockItem (sync).
 *
 * Espejo del StockDto desktop (existencia ACTUAL de un producto en una bodega,
 * proyección del ledger). La nube es RELAY: NO recalcula el costo promedio ni las
 * existencias (eso ocurre en el desktop al postear movimientos); los valores viajan
 * tal cual (round-trip 1:1). Entidad PLANA (sin hijos).
 *
 * @module Contracts/Inventory
 */

/** DTO de respuesta para consultas/sync de existencias. */
export interface StockItemResponse {
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
    /** Existencia física en unidad base. */
    readonly onHand: number;
    /** Cantidad reservada (comprometida y no despachada). */
    readonly reserved: number;
    /** Costo promedio ponderado vigente. */
    readonly averageCost: number;
    /** Sucursal (scoping denormalizado; null = general; soft ref). */
    readonly locationId: string | null;

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
