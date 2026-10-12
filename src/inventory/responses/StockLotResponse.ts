/**
 * @fileoverview Lotes y números de serie tal como los ven la web, el escritorio y el sync.
 * @module Contracts/Inventory/Responses/StockLot
 *
 * El lote es catálogo (viaja por sync: `entityType: 'stock-lot'`); sus saldos por bodega son
 * proyección del kárdex y **no** viajan — cada punta los deriva, como `stock_items`.
 */

import type { SerialNumberStatus, StockLotStatus } from '../schemas/stockLot.schema.js';
import type { StockSourceType } from './StockMovementResponse.js';
import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';

/** Lo que queda de un lote en una bodega. Derivado. */
export interface StockLotBalanceResponse {
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly onHand: number;
    readonly reserved: number;
}

export interface StockLotResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    readonly lotNumber: string;
    readonly manufacturedAt: string | null;
    readonly expiresAt: string | null;
    readonly status: StockLotStatus;
    readonly statusReason: string | null;
    readonly note: string | null;

    /** Primera entrada: de quién y cuándo (la compra que lo trajo, la orden que lo produjo). */
    readonly receivedAt: string;
    readonly originSourceType: StockSourceType;
    readonly originDocId: string | null;
    readonly supplierName: string | null;

    /** Derivados. Suma de saldos, y días a la caducidad (negativo = ya caducó). */
    readonly onHand: number;
    readonly daysToExpiry: number | null;
    readonly balances: readonly StockLotBalanceResponse[];

    readonly deviceId: string | null;
    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly version: number;
}

export interface GetStockLotsResponse {
    readonly items: readonly StockLotResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Para el pie de la lista: lotes con saldo que caducan en los próximos días de la alerta. */
    readonly expiringSoon: number;
    readonly expired: number;
}

/**
 * La traza de un lote: todos los movimientos que lo nombran. «¿A quién le vendimos el lote
 * L2409?» es la pregunta de un retiro de mercado, y se contesta con esto.
 */
export interface StockLotTraceEntryResponse {
    readonly movementId: string;
    readonly occurredAt: string;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly direction: 'IN' | 'OUT';
    readonly quantity: number;
    readonly sourceType: StockSourceType;
    readonly sourceDocId: string | null;
    /** Cliente o proveedor del documento, si lo hay. */
    readonly counterpartyName: string | null;
    readonly balanceAfter: number;
}

export interface StockLotTraceResponse {
    readonly lot: StockLotResponse;
    readonly entries: readonly StockLotTraceEntryResponse[];
}

export interface SerialNumberResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    readonly serialNumber: string;
    readonly status: SerialNumberStatus;
    /** Dónde está, si está en una bodega. */
    readonly warehouseId: string | null;
    readonly warehouseName: string | null;
    /** Lote al que pertenece, si el producto se rastrea por los dos. */
    readonly lotId: string | null;
    readonly receivedAt: string;
    readonly receivedDocId: string | null;
    readonly unitCost: number;
    /** Venta: a quién y cuándo, y hasta cuándo tiene garantía. */
    readonly soldAt: string | null;
    readonly soldDocId: string | null;
    readonly customerName: string | null;
    readonly warrantyUntil: string | null;
    readonly lastMovementAt: string;
}

export interface GetSerialNumbersResponse {
    readonly items: readonly SerialNumberResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}

export type SyncPullStockLotResponse = SyncPullResponse<StockLotResponse>;
export type SyncPushStockLotResponse = SyncPushResponse;
