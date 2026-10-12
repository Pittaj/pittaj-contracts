/**
 * @fileoverview Plantillas de etiqueta y renglones propuestos.
 * @module Contracts/Inventory/Responses/Label
 *
 * La plantilla viaja por sync (`entityType: 'label-template'`): la térmica está conectada al
 * escritorio, pero la plantilla se puede diseñar desde cualquier lado.
 */

import type { LabelField, LabelOutput } from '../schemas/labelPrint.schema.js';

export interface LabelTemplateResponse {
    readonly id: string;
    readonly name: string;
    readonly widthMm: number;
    readonly heightMm: number;
    readonly columns: number;
    readonly rows: number;
    readonly fields: readonly LabelField[];
    readonly symbology: 'EAN13' | 'CODE128' | 'QR';
    readonly output: LabelOutput;
    readonly priceListId: string | null;
    readonly isDefault: boolean;
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
    /** Copias sugeridas (en una compra: lo recibido; en un cambio de precio: la existencia). */
    readonly copies: number;
}
