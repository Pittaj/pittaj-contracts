/**
 * @fileoverview El ajuste / conteo físico tal como lo ven la web, el escritorio y el sync.
 * @module Contracts/Inventory/Responses/StockAdjustment
 *
 * Es también el DTO del feed de sync (`entityType: 'stock-adjustment'`): los renglones viajan
 * anidados, y los nombres de bodega y producto son **snapshots** para que el documento se lea
 * aunque la bodega se renombre o el producto se archive.
 */

import type {
    StockAdjustmentKind,
    StockAdjustmentReason,
    StockAdjustmentStatus,
} from '../schemas/stockAdjustment.schema.js';
import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';

export interface StockAdjustmentLineResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    /**
     * El movimiento de cuadre, con signo: + entra, − sale. En un conteo es `contado − teórico`
     * (cero mientras no se cuente).
     */
    readonly quantity: number;
    /** Conteo: la existencia teórica en el momento de contar. Nulo en un ajuste. */
    readonly expectedQuantity: number | null;
    /** Conteo: lo contado. Nulo = sin contar (no escribe nada al aplicar). */
    readonly countedQuantity: number | null;
    /**
     * Costo unitario. En borrador, el capturado para una entrada (o nulo = al promedio); una vez
     * aplicado, el que de verdad se usó.
     */
    readonly unitCost: number | null;
}

export interface StockAdjustmentResponse {
    readonly id: string;
    /** `AW-00014`. */
    readonly adjustmentNumber: string;
    readonly kind: StockAdjustmentKind;
    readonly status: StockAdjustmentStatus;
    readonly reason: StockAdjustmentReason;

    readonly warehouseId: string;
    readonly warehouseName: string;

    readonly note: string | null;

    readonly appliedAt: string | null;
    readonly appliedBy: string | null;
    readonly appliedByName: string | null;
    readonly cancelledAt: string | null;
    readonly cancelReason: string | null;

    /** Derivados, para la lista. Piezas que entran y que salen (sin signo). */
    readonly totalIn: number;
    readonly totalOut: number;
    /** Valor del cuadre (Σ cantidad con signo × costo). Solo tiene sentido aplicado. */
    readonly valueImpact: number;
    /** Conteo: renglones contados y por contar. En un ajuste, todos cuentan como contados. */
    readonly countedLines: number;
    readonly pendingLines: number;

    readonly lines: readonly StockAdjustmentLineResponse[];

    /** Desde qué instalación nació (para que el feed no se lo devuelva a quien lo subió). */
    readonly deviceId: string | null;

    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly version: number;
}

export interface GetStockAdjustmentsResponse {
    readonly items: readonly StockAdjustmentResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Borradores abiertos en toda la cuenta (de este tipo), sin filtros: el número del pie. */
    readonly abiertos: number;
}

export type SyncPullStockAdjustmentResponse = SyncPullResponse<StockAdjustmentResponse>;
export type SyncPushStockAdjustmentResponse = SyncPushResponse;
