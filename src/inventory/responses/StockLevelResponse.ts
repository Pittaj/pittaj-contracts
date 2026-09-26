/**
 * @fileoverview El nivel de existencia (mín/reorden/máx) de un producto en una bodega.
 * @module Contracts/Inventory/Responses/StockLevel
 *
 * Es también el DTO del feed de sync (`entityType: 'stock-level'`). Entidad PLANA.
 */

import type { StockLevelSource } from '../schemas/stockLevel.schema.js';
import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';

export interface StockLevelResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string | null;
    readonly productCode: string | null;
    readonly warehouseId: string;
    readonly minStock: number;
    readonly reorderPoint: number;
    readonly maxStock: number;
    readonly reorderQuantity: number | null;
    readonly source: StockLevelSource;

    /** Lectura: la existencia de hoy, para que la hoja enseñe contra qué se compara. */
    readonly onHand?: number;

    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly version: number;
}

/** Un renglón de la propuesta de `POST /api/stock-levels/suggest`. No está guardado. */
export interface StockLevelSuggestionResponse {
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    /** Venta promedio por día en la ventana pedida (unidad base). */
    readonly dailyDemand: number;
    /** Días con venta en la ventana: una demanda de 3 días de 90 no es para fiarse. */
    readonly daysWithSales: number;
    readonly current: { readonly minStock: number; readonly reorderPoint: number; readonly maxStock: number } | null;
    readonly suggested: { readonly minStock: number; readonly reorderPoint: number; readonly maxStock: number };
}

export interface GetStockLevelsResponse {
    readonly items: readonly StockLevelResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}

export type SyncPullStockLevelResponse = SyncPullResponse<StockLevelResponse>;
export type SyncPushStockLevelResponse = SyncPushResponse;
