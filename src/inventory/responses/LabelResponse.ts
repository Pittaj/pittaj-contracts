/**
 * @fileoverview Plantillas de etiqueta y renglones propuestos.
 * @module Contracts/Inventory/Responses/Label
 *
 * La plantilla viaja por sync (`entityType: 'label-template'`): la térmica está conectada al
 * escritorio, pero la plantilla se puede diseñar desde cualquier lado.
 */

import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';
import type { BarcodeSymbology, LabelField, LabelOutput, LabelPageSize } from '../schemas/labelPrint.schema.js';

export interface LabelTemplateResponse {
    readonly id: string;
    readonly name: string;
    readonly widthMm: number;
    readonly heightMm: number;
    readonly columns: number;
    readonly rows: number;
    readonly fields: readonly LabelField[];
    readonly symbology: BarcodeSymbology;
    readonly output: LabelOutput;
    readonly priceListId: string | null;
    readonly pageSize: LabelPageSize;
    readonly marginTopMm: number | null;
    readonly marginLeftMm: number | null;
    readonly gapXMm: number;
    readonly gapYMm: number;
    /** La de `inventory.labels.defaultTemplateId`. */
    readonly isDefault: boolean;
    /** Instalación que la creó (anti-rebote del feed). Nulo = nació en la web. */
    readonly deviceId?: string | null;
    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly version: number;
}

export interface ProposedLabelLineResponse {
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    readonly barcode: string | null;
    readonly price: number;
    readonly unitId: string | null;
    readonly unitName: string | null;
    readonly lotId: string | null;
    readonly lotNumber: string | null;
    readonly expiresAt: string | null;
    /** I10a · Las series de lo que entró con el documento (una etiqueta por serie). */
    readonly serialNumbers: readonly string[];
    /** Copias sugeridas (en una compra: lo recibido; en un cambio de precio: la existencia). */
    readonly copies: number;
}

/**
 * I10a · Un renglón ya resuelto para imprimir: todo lo que puede ir en la etiqueta, con el precio
 * **al público** (con sus impuestos; `precioDeEtiqueta`). `expandirEtiquetas` lo vuelve etiquetas.
 */
export interface LabelLineDataResponse {
    readonly productId: string;
    readonly name: string;
    readonly code: string | null;
    readonly barcode: string | null;
    readonly price: number;
    readonly priceWholesale: number | null;
    readonly currency: string;
    readonly unitName: string | null;
    readonly categoryName: string | null;
    readonly lotNumber: string | null;
    readonly expiresAt: string | null;
    readonly variant: string | null;
    /** (2.82.0) Ubicación en la bodega de la impresión (nivel del producto), o nulo. */
    readonly location?: string | null;
    readonly serialNumbers: readonly string[];
    readonly copies: number;
}

/** POST /api/labels/print — la plantilla y los renglones resueltos; la punta dibuja. */
export interface LabelPrintResponse {
    readonly template: LabelTemplateResponse;
    readonly companyName: string;
    readonly skipPositions: number;
    readonly lines: readonly LabelLineDataResponse[];
}

export type SyncPullLabelTemplateResponse = SyncPullResponse<LabelTemplateResponse>;
export type SyncPushLabelTemplateResponse = SyncPushResponse;
