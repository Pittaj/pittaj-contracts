/**
 * @fileoverview Alertas, configuración y tablero de Inventario.
 * @module Contracts/Inventory/Responses/InventoryAlert
 */

import type {
    InventoryAlertKind,
    InventoryAlertSeverity,
} from '../schemas/inventoryAlert.schema.js';
import type { InventorySettings } from '../schemas/inventorySettings.schema.js';

export interface InventoryAlertResponse {
    /**
     * Id estable derivado de la condición (`LOW_STOCK:{productId}:{warehouseId}`), no un uuid:
     * la misma condición recalculada es la misma alerta, y el acuse se le queda pegado.
     */
    readonly id: string;
    readonly kind: InventoryAlertKind;
    readonly severity: InventoryAlertSeverity;
    /** Una línea que se entienda sola: «Coca-Cola 600 ml: 4 pz, mínimo 24». */
    readonly message: string;

    readonly productId: string | null;
    readonly productName: string | null;
    readonly productCode: string | null;
    readonly warehouseId: string | null;
    readonly warehouseName: string | null;
    readonly lotId: string | null;
    readonly lotNumber: string | null;
    /** Documento implicado (traspaso, conteo). */
    readonly docId: string | null;
    readonly docNumber: string | null;

    /** Los números de la condición, para que la lista los ordene. */
    readonly onHand: number | null;
    readonly threshold: number | null;
    readonly daysToExpiry: number | null;
    readonly daysWithoutMovement: number | null;
    /** Valor en riesgo (existencia × costo) para ordenar por lo que más duele. */
    readonly valueAtRisk: number;

    readonly since: string;
    readonly acknowledgedAt: string | null;
    readonly acknowledgedByName: string | null;
    readonly snoozeUntil: string | null;
}

export interface GetInventoryAlertsResponse {
    readonly items: readonly InventoryAlertResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Conteo por tipo, sin filtro de tipo: las pestañas de la lista. */
    readonly byKind: Readonly<Partial<Record<InventoryAlertKind, number>>>;
}

export interface InventorySettingsResponse extends InventorySettings {
    readonly updatedAt: string | null;
    readonly updatedByName: string | null;
    readonly version: number;
}

/** GET /api/inventory/home — el tablero de entrada de la app. Todo derivado. */
export interface InventoryHomeResponse {
    readonly asOf: string;
    /** Valor total del inventario (Σ existencia × costo promedio) y su cambio en 30 días. */
    readonly totalValue: number;
    readonly totalValueDelta30d: number;
    readonly productsWithStock: number;
    /** Los cajones de pendientes. Cada uno abre su lista ya filtrada. */
    readonly cajones: {
        readonly lowStock: number;
        readonly negative: number;
        readonly expiringSoon: number;
        readonly transfersInTransit: number;
        readonly transfersToReceive: number;
        readonly countsOpen: number;
        readonly adjustmentsDraft: number;
        readonly reservationsExpiring: number;
    };
    /** Exactitud del inventario: renglones que cuadraron en los conteos de los últimos 90 días. */
    readonly countAccuracy90d: number | null;
    /** Merma de los últimos 30 días en valor y como % del costo de venta. */
    readonly shrinkage30d: { readonly value: number; readonly pctOfCogs: number | null };
    /** Rotación anualizada (costo de venta / inventario promedio) y días de inventario. */
    readonly turnover: number | null;
    readonly daysOfInventory: number | null;
    /** Valor por bodega, para la franja. */
    readonly byWarehouse: readonly {
        readonly warehouseId: string;
        readonly warehouseName: string;
        readonly value: number;
        readonly products: number;
    }[];
}
