/**
 * @fileoverview El traspaso tal como lo ven la web, el escritorio y el sync.
 * @module Contracts/Inventory/Responses/StockTransfer
 *
 * Es también el DTO del feed de sync (`entityType: 'stock-transfer'`): los renglones viajan
 * anidados, y los nombres de bodega y producto son **snapshots** para que el documento se lea
 * aunque la bodega se renombre o el producto se archive.
 */

import type { StockTransferOrigin, StockTransferStatus } from '../schemas/stockTransfer.schema.js';
import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';

export interface StockTransferLineResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    /** Lo que salió del origen. */
    readonly quantity: number;
    /** Lo que entró en destino. Nulo hasta que se recibe. */
    readonly receivedQuantity: number | null;
    /** Costo promedio en origen al enviar: el traspaso no cambia el costo, solo el sitio. */
    readonly unitCost: number;
}

export interface StockTransferResponse {
    readonly id: string;
    /** `TR-00014`. */
    readonly transferNumber: string;
    readonly status: StockTransferStatus;

    readonly fromWarehouseId: string;
    readonly fromWarehouseName: string;
    readonly toWarehouseId: string;
    readonly toWarehouseName: string;

    readonly note: string | null;

    readonly originKind: StockTransferOrigin;
    /** La solicitud (`SOL-…`) de la que nació, si nació de una. */
    readonly originDocId: string | null;
    readonly originDocNumber: string | null;

    readonly sentAt: string | null;
    readonly sentBy: string | null;
    readonly sentByName: string | null;
    readonly receivedAt: string | null;
    readonly receivedBy: string | null;
    readonly receivedByName: string | null;
    readonly cancelledAt: string | null;
    readonly cancelReason: string | null;

    /** Derivados, para la lista: piezas y valor al costo de origen. */
    readonly totalQuantity: number;
    readonly totalValue: number;
    /** Si al recibir faltó algo: piezas que salieron y no llegaron. */
    readonly missingQuantity: number;

    readonly lines: readonly StockTransferLineResponse[];

    /** Desde qué instalación nació (para que el feed no se lo devuelva a quien lo subió). */
    readonly deviceId: string | null;

    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly version: number;
}

export interface GetStockTransfersResponse {
    readonly items: readonly StockTransferResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Cuántos están en camino (SENT) en toda la cuenta, sin filtros: es el número del pie. */
    readonly enCamino: number;
    readonly valorEnCamino: number;
}

export type SyncPullStockTransferResponse = SyncPullResponse<StockTransferResponse>;
export type SyncPushStockTransferResponse = SyncPushResponse;
