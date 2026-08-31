/**
 * @fileoverview Conversión en lote: pasar de N comprobantes del buzón a N compras.
 * @module Contracts/Purchase/Schemas/CfdiBatch
 *
 * ── Por qué el lote no es «llamar N veces a lo de uno» ──
 *
 * Convertir de uno en uno es la razón por la que un buzón deja de usarse: quien recibe treinta
 * facturas al mes no abre treinta pantallas. Pero un botón que convierte treinta a ciegas es peor,
 * porque los errores salen todos juntos y ya escritos.
 *
 * Por eso son dos pasos:
 *
 * 1. **Vista previa** (`POST /purchases/cfdi-batch/preview`) — no escribe nada. Dice, por
 *    comprobante, cuántos conceptos se resolvieron solos con la memoria del proveedor y cuáles
 *    piden una decisión. **Separa lo que pasa solo de lo que no**, y solo enseña lo segundo.
 * 2. **Conversión** (`POST /purchases/cfdi-batch`) — crea las compras y devuelve, una por una,
 *    qué se creó y qué se quedó fuera y por qué.
 *
 * ── Quién lee el XML ──
 *
 * El cliente, igual que en el flujo de uno. El comprobante guarda su XML crudo y no sus conceptos,
 * y los parsers viven en las puntas —`cfdiXml.ts` en la web con `DOMParser`, `CfdiImport` en el
 * escritorio—. Un tercer parser en el Worker sería una tercera verdad sobre el mismo archivo, y
 * además `DOMParser` no existe allí. Así que **lo que viaja son los conceptos ya leídos**, y el
 * servidor pone lo que solo él sabe: la memoria del proveedor, el catálogo y los bloqueos.
 */

import { z } from 'zod';
import { cfdiConceptoSchema, cfdiResolvedConceptoSchema } from './cfdiMatch.schema.js';

/**
 * Lo común a los dos pasos.
 *
 * `warehouseId` y `locationId` son **del lote**, no de cada comprobante: un lote es «lo que llegó
 * a esta bodega», y pedirlos por comprobante devolvería la pantalla al formulario que se quería
 * evitar. Quien reciba en dos bodegas hace dos lotes.
 */
const loteBase = {
    warehouseId: z.string().uuid('Bodega inválida'),
    locationId: z.string().uuid('Sucursal inválida').nullish(),
};

/**
 * Tope del lote.
 *
 * No es técnico, es de sentido: un lote que no se puede revisar de un vistazo deja de ser una
 * revisión y pasa a ser un acto de fe. Cien comprobantes ya es un mes entero de una tienda.
 */
const MAX_DEL_LOTE = 100;

export const cfdiBatchPreviewSchema = z.object({
    ...loteBase,
    /**
     * Dar de alta los conceptos que nunca se han comprado, en vez de dejarlos pendientes.
     *
     * **Apagado por defecto, y a propósito.** Un lote que crea productos solo es la forma más
     * rápida de acabar con un catálogo lleno de «SERV. DE FLETE FORANEO 2DA ENTREGA» duplicado
     * cinco veces. Encendido, el usuario está diciendo que ya vio cuántos son y le parecen bien;
     * la pantalla enseña el número antes de que lo encienda.
     */
    darDeAltaFaltantes: z.boolean().optional().default(false),
    items: z
        .array(
            z
                .object({
                    cfdiId: z.string().uuid('Id de comprobante inválido'),
                    conceptos: z.array(cfdiConceptoSchema).min(1).max(500),
                })
                .strict()
        )
        .min(1, 'Selecciona al menos un comprobante')
        .max(MAX_DEL_LOTE, `Máximo ${MAX_DEL_LOTE} comprobantes por lote`),
});

export const createPurchasesFromCfdiBatchSchema = z.object({
    ...loteBase,
    /**
     * Margen con el que nacen los productos que se dan de alta en el lote.
     *
     * Solo se usa para los conceptos marcados `createProduct`, que salen de haber encendido
     * «dar de alta los faltantes» en la vista previa.
     */
    marginPercent: z.number().min(0).max(1000).optional().default(30),
    items: z
        .array(
            z
                .object({
                    /** Id de la compra a crear. Lo genera el cliente: identidad en origen. */
                    id: z.string().uuid('Id de compra inválido'),
                    cfdiId: z.string().uuid('Id de comprobante inválido'),
                    supplierId: z.string().uuid('Proveedor inválido'),
                    supplierName: z.string().trim().min(1).max(200),
                    supplierTaxId: z.string().trim().max(20).nullish(),
                    kind: z.enum(['INVENTORY', 'EXPENSE', 'FIXED_ASSET']).optional(),
                    conceptos: z.array(cfdiResolvedConceptoSchema).min(1).max(500),
                })
                .strict()
        )
        .min(1, 'Selecciona al menos un comprobante')
        .max(MAX_DEL_LOTE, `Máximo ${MAX_DEL_LOTE} comprobantes por lote`),
    /**
     * Guardar la equivalencia concepto→producto de cada comprobante convertido.
     *
     * Encendido por defecto: es lo que hace que el lote del mes que viene tenga menos excepciones
     * que el de este, y la única forma de que el emparejado mejore solo.
     */
    rememberLinks: z.boolean().optional().default(true),
    /**
     * Dar también por recibida cada compra creada.
     *
     * **Apagado por defecto, y es lo correcto.** Doce comprobantes son doce entradas al
     * inventario: si una cantidad viene mal se descubre cuando el stock ya se movió. Quien
     * factura y recibe el mismo día puede encenderlo.
     */
    receive: z.boolean().optional().default(false),
});

export type CfdiBatchPreviewRequest = z.infer<typeof cfdiBatchPreviewSchema>;
export type CreatePurchasesFromCfdiBatchRequest = z.infer<
    typeof createPurchasesFromCfdiBatchSchema
>;
