/**
 * @fileoverview La reserva tal como la ven la web, el escritorio y el sync.
 * @module Contracts/Inventory/Responses/StockReservation
 *
 * DTO del feed de sync (`entityType: 'stock-reservation'`): un apartado hecho en el escritorio sin
 * red tiene que restar disponible en la web cuando llegue, y al revés.
 */

import type { StockReservationSource, StockReservationStatus } from '../schemas/stockReservation.schema.js';
import type { LotAllocationInput } from '../schemas/stockLot.schema.js';
import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';

export interface StockReservationResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly quantity: number;
    /** Lo que ya salió por el documento origen (despacho parcial). */
    readonly fulfilledQuantity: number;
    readonly lots: readonly LotAllocationInput[];

    readonly status: StockReservationStatus;
    readonly sourceType: StockReservationSource;
    /** Documento que reserva (id y folio). Nulo en las manuales. */
    readonly sourceDocId: string | null;
    readonly sourceDocNumber: string | null;

    readonly customerId: string | null;
    readonly holderName: string | null;
    readonly note: string | null;
    readonly expiresAt: string | null;

    readonly createdByName: string | null;
    readonly releasedAt: string | null;
    readonly releaseReason: string | null;

    readonly deviceId: string | null;
    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly version: number;
}

export interface GetStockReservationsResponse {
    readonly items: readonly StockReservationResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Piezas reservadas activas con los filtros aplicados (para el pie). */
    readonly totalReserved: number;
}

export type SyncPullStockReservationResponse = SyncPullResponse<StockReservationResponse>;
export type SyncPushStockReservationResponse = SyncPushResponse;
