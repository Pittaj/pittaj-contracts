/**
 * @fileoverview DTO de respuesta para Warehouse (sync).
 *
 * Espejo del WarehouseDto desktop (Pittaj.Application/Inventory/Dtos/InventoryDtos).
 * Shape que ambos lados serializan/parsean: el desktop lo produce en su Describe
 * (push) y lo consume en ApplyWarehouseAsync (pull); la nube lo emite desde
 * WarehouseResponseMapper. Catálogo PLANO (sin hijos).
 *
 * @module Contracts/Inventory
 */

/** Estado de la bodega: ACTIVE | INACTIVE. */
export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

/** DTO de respuesta para consultas/sync de bodegas. */
export interface WarehouseResponse {
    readonly id: string;
    /** Nombre de la bodega (único por tenant). */
    readonly name: string;
    /** Código corto (null = sin capturar). */
    readonly code: string | null;
    /** Sucursal dueña de la bodega (null = general; soft ref). */
    readonly locationId: string | null;
    /** Bodega predeterminada (el POS descuenta de ella). */
    readonly isDefault: boolean;
    readonly status: WarehouseStatus;

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
