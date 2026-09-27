/**
 * @fileoverview Etiquetas: plantillas y trabajos de impresión.
 * @module Contracts/Inventory/Schemas/LabelPrint
 *
 * La plantilla es catálogo (qué va en la etiqueta y de qué tamaño); el trabajo es la lista de
 * productos y cuántas de cada uno. **Imprimir es un periférico** (una de las cuatro excepciones
 * físicas del mandato de paridad): la web genera PDF para impresora de hojas, y el escritorio
 * además manda ZPL/EPL a la impresora térmica. El contrato de la plantilla y del trabajo es el
 * mismo; lo que cambia es la salida.
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
] as const;
export type LabelField = (typeof LABEL_FIELDS)[number];

export const BARCODE_SYMBOLOGIES = ['EAN13', 'CODE128', 'QR'] as const;
export const LABEL_OUTPUTS = ['PDF_SHEET', 'ZPL', 'EPL'] as const;
export type LabelOutput = (typeof LABEL_OUTPUTS)[number];

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
    /** Lista de precios de la que sale PRICE (nula = precio de venta del producto). */
    priceListId: z.string().uuid().nullish(),
});

export const createLabelTemplateSchema = plantillaBody.extend({ id: z.string().uuid() });
export const updateLabelTemplateSchema = plantillaBody.extend({ version: z.number().int().min(1) });

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
});

/** POST /api/labels/propose — renglones sugeridos a partir de un origen. */
export const proposeLabelsSchema = z.discriminatedUnion('from', [
    z.object({ from: z.literal('DOCUMENT'), sourceType: z.enum(STOCK_SOURCE_TYPES), sourceDocId: z.string().max(40) }),
    z.object({ from: z.literal('PRICE_CHANGES'), since: z.coerce.date(), priceListId: z.string().uuid().nullish() }),
    z.object({ from: z.literal('CATEGORY'), categoryId: z.string().uuid(), warehouseId: z.string().uuid().optional() }),
]);

export type CreateLabelTemplateRequest = z.infer<typeof createLabelTemplateSchema>;
export type UpdateLabelTemplateRequest = z.infer<typeof updateLabelTemplateSchema>;
export type PrintLabelsRequest = z.infer<typeof printLabelsSchema>;
export type ProposeLabelsRequest = z.infer<typeof proposeLabelsSchema>;
