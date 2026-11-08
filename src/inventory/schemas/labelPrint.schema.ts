/**
 * @fileoverview Etiquetas: plantillas y trabajos de impresión.
 * @module Contracts/Inventory/Schemas/LabelPrint
 *
 * La plantilla es catálogo (qué va en la etiqueta y de qué tamaño); el trabajo es la lista de
 * productos y cuántas de cada uno. **Imprimir es un periférico** (una de las cuatro excepciones
 * físicas del mandato de paridad): la web genera PDF para impresora de hojas, y el escritorio
 * además manda ZPL/EPL a la impresora térmica. El contrato de la plantilla y del trabajo es el
 * mismo; lo que cambia es la salida.
 *
 * I10a (2026-11-02): la hoja lleva su tamaño, márgenes y separación (una Avery 5160 no se centra:
 * tiene medio centímetro de margen arriba). Qué se dibuja y dónde lo decide `reglasDeEtiquetas.ts`
 * (espejo `ReglasDeEtiquetas.cs`), para que la web y el escritorio impriman la misma etiqueta.
 */

import { z } from 'zod';
import { STOCK_SOURCE_TYPES } from './getStockMovements.schema.js';

/** Lo que se puede poner en una etiqueta. El orden de la lista es el de la plantilla. */
export const LABEL_FIELDS = [
    'NAME',
    'CODE',
    'BARCODE',
    'PRICE',
    'PRICE_WHOLESALE',
    'UNIT',
    'CATEGORY',
    'LOT',
    'EXPIRY',
    'SERIAL',
    'VARIANT',
    'COMPANY',
    /** (2.82.0) Dónde va en la bodega (pasillo/anaquel), la del nivel del producto en la bodega de la impresión. */
    'LOCATION',
] as const;
export type LabelField = (typeof LABEL_FIELDS)[number];

export const BARCODE_SYMBOLOGIES = ['EAN13', 'CODE128', 'QR'] as const;
export const LABEL_OUTPUTS = ['PDF_SHEET', 'ZPL', 'EPL'] as const;
export type LabelOutput = (typeof LABEL_OUTPUTS)[number];
export type BarcodeSymbology = (typeof BARCODE_SYMBOLOGIES)[number];
/** Tamaño de la hoja de PDF_SHEET. En térmica, la página es la etiqueta. */
export const LABEL_PAGE_SIZES = ['LETTER', 'A4'] as const;
export type LabelPageSize = (typeof LABEL_PAGE_SIZES)[number];

const plantillaBody = z.object({
    name: z.string().trim().min(1).max(80),
    widthMm: z.number().min(10).max(200),
    heightMm: z.number().min(10).max(200),
    /** PDF_SHEET: etiquetas por hoja (Avery 5160 = 3 × 10). */
    columns: z.number().int().min(1).max(10).optional().default(1),
    rows: z.number().int().min(1).max(30).optional().default(1),
    fields: z.array(z.enum(LABEL_FIELDS)).min(1).max(LABEL_FIELDS.length),
    symbology: z.enum(BARCODE_SYMBOLOGIES).optional().default('CODE128'),
    output: z.enum(LABEL_OUTPUTS).optional().default('PDF_SHEET'),
    /** Lista de precios de la que sale PRICE (nula = la de la sucursal o la de por omisión, como la caja). */
    priceListId: z.string().uuid().nullish(),
    /** PDF_SHEET: la hoja. */
    pageSize: z.enum(LABEL_PAGE_SIZES).optional().default('LETTER'),
    /** PDF_SHEET: margen superior e izquierdo. Nulos = la rejilla va centrada en la hoja. */
    marginTopMm: z.number().min(0).max(100).nullish(),
    marginLeftMm: z.number().min(0).max(100).nullish(),
    /** PDF_SHEET: separación entre columnas y entre renglones de etiquetas. */
    gapXMm: z.number().min(0).max(50).optional().default(0),
    gapYMm: z.number().min(0).max(50).optional().default(0),
});

export const createLabelTemplateSchema = plantillaBody.extend({ id: z.string().uuid() });
export const updateLabelTemplateSchema = plantillaBody.extend({ version: z.number().int().min(1) });

/** DELETE /api/label-templates/:id?version= */
export const deleteLabelTemplateQuerySchema = z.object({ version: z.coerce.number().int().min(1) });

/**
 * POST /api/labels/print — generar las etiquetas.
 *
 * Los renglones se pueden armar a mano o traer de un documento («las de la compra C-00412»,
 * «las que cambiaron de precio desde ayer»): `from` los propone y el usuario ajusta cantidades.
 */
export const printLabelsSchema = z.object({
    templateId: z.string().uuid(),
    lines: z
        .array(
            z
                .object({
                    productId: z.string().uuid(),
                    /** Presentación (unidad alterna) cuyo código y precio van en la etiqueta. */
                    unitId: z.string().uuid().nullish(),
                    lotId: z.string().uuid().nullish(),
                    serialNumbers: z.array(z.string().max(80)).max(500).optional(),
                    copies: z.number().int().min(1).max(1000),
                })
                .strict()
        )
        .min(1)
        .max(2000),
    /** PDF_SHEET: saltar las primeras N posiciones de la hoja (hojas ya usadas a medias). */
    skipPositions: z.number().int().min(0).max(299).optional().default(0),
    /** Sucursal cuya lista de precios manda si la plantilla no fija una (como en la caja). */
    locationId: z.string().uuid().nullish(),
    /** (2.82.0) Bodega cuya ubicación de anaquel va en el campo `LOCATION`. Sin bodega, ese campo sale vacío. */
    warehouseId: z.string().uuid().nullish(),
});

/** POST /api/labels/propose — renglones sugeridos a partir de un origen. */
export const proposeLabelsSchema = z.discriminatedUnion('from', [
    z.object({ from: z.literal('DOCUMENT'), sourceType: z.enum(STOCK_SOURCE_TYPES), sourceDocId: z.string().max(40) }),
    /** I10b · Los productos cuyo precio cambió desde una fecha; con bodega, tantas como hay en ella. */
    z.object({ from: z.literal('PRICE_CHANGES'), since: z.coerce.date(), priceListId: z.string().uuid().nullish(), warehouseId: z.string().uuid().optional() }),
    z.object({ from: z.literal('CATEGORY'), categoryId: z.string().uuid(), warehouseId: z.string().uuid().optional() }),
    /** I10a · Los productos elegidos a mano (o escaneados): una etiqueta de cada uno. */
    z.object({ from: z.literal('PRODUCTS'), productIds: z.array(z.string().uuid()).min(1).max(500), warehouseId: z.string().uuid().optional() }),
]);

export type CreateLabelTemplateRequest = z.infer<typeof createLabelTemplateSchema>;
export type UpdateLabelTemplateRequest = z.infer<typeof updateLabelTemplateSchema>;
export type PrintLabelsRequest = z.infer<typeof printLabelsSchema>;
export type ProposeLabelsRequest = z.infer<typeof proposeLabelsSchema>;
export type LabelTemplateInput = z.input<typeof plantillaBody>;
