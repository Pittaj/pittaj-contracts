/**
 * @fileoverview Zod schemas del emparejado de conceptos de un CFDI (F5.1d).
 * @module Contracts/Purchase/Schemas
 *
 * Dos rutas, y la división entre ellas es la decisión de este archivo:
 *
 * - `POST /api/purchases/cfdi-match` — **empareja**, no escribe nada. Recibe los
 *   conceptos ya leídos del XML y devuelve cada uno con su producto.
 * - `POST /api/purchases/from-cfdi` — **crea la compra** desde el comprobante: da de
 *   alta lo que falte, arma el documento y recuerda las equivalencias.
 *
 * ── Por qué el XML no viaja aquí ──
 *
 * La nube corre en Workers y **no tiene parser de XML**; el escritorio lee el suyo con
 * `XDocument` porque trabaja sin red. Así que el XML se lee en la punta —`DOMParser` en
 * la web— y lo que viaja son los conceptos ya normalizados. Las **reglas** del
 * emparejado sí son una sola: `cfdiMatching.ts`, replicado en `CfdiMatching.cs`.
 *
 * ── Por qué la cabecera fiscal no viaja tampoco ──
 *
 * `from-cfdi` recibe el **id del comprobante en el buzón**, no su UUID ni sus impuestos.
 * El folio, la fecha, el método de pago y los cuatro impuestos desglosados salen de la
 * fila que ya está guardada, que es la que bajó del SAT. Aceptarlos del navegador sería
 * dejar que el cliente escriba datos fiscales que el servidor ya tiene mejores.
 */

import { z } from 'zod';
import { PURCHASE_KINDS } from './getPurchases.schema.js';

const ERROR_MESSAGES = {
    ID_INVALID_UUID: 'El ID debe ser un UUID válido',
    DESCRIPCION_REQUIRED: 'El concepto necesita una descripción',
    QUANTITY_POSITIVE: 'La cantidad debe ser mayor que cero',
    COST_NOT_NEGATIVE: 'El costo no puede ser negativo',
    TAX_FRACTION: 'El impuesto es una fracción entre 0 y 1 (0.16 = 16 %)',
    MARGIN_RANGE: 'El margen va de 0 a 1000 %',
    CONCEPTS_REQUIRED: 'El comprobante no trae conceptos',
} as const;

/**
 * Un concepto de CFDI tal como lo leyó la punta.
 *
 * Espejo de `CfdiConceptoInput` de `cfdiMatching.ts`: los importes van **como los trae
 * el comprobante** — `descuento` es un importe, `taxRate` es una fracción.
 */
export const cfdiConceptoSchema = z
    .object({
        /** ClaveProdServ del SAT. */
        claveProdServ: z.string().trim().max(20).optional().default(''),
        /** ClaveUnidad del SAT (H87, KGM, E48…). */
        claveUnidad: z.string().trim().max(20).nullish(),
        /** SKU del proveedor: la clave estable del concepto cuando viene. */
        noIdentificacion: z.string().trim().max(120).nullish(),
        descripcion: z.string().trim().min(1, { message: ERROR_MESSAGES.DESCRIPCION_REQUIRED }).max(1000),
        cantidad: z.number().positive({ message: ERROR_MESSAGES.QUANTITY_POSITIVE }),
        valorUnitario: z.number().min(0, { message: ERROR_MESSAGES.COST_NOT_NEGATIVE }),
        importe: z.number().min(0).optional().default(0),
        /** Descuento del CFDI: IMPORTE, no porcentaje. */
        descuento: z.number().min(0).optional().default(0),
        /** Traslado del concepto como fracción (0.16). */
        taxRate: z
            .number()
            .min(0, { message: ERROR_MESSAGES.TAX_FRACTION })
            .max(1, { message: ERROR_MESSAGES.TAX_FRACTION })
            .optional()
            .default(0),
    })
    .strict();

export type CfdiConceptoRequest = z.infer<typeof cfdiConceptoSchema>;

/**
 * POST /api/purchases/cfdi-match — empareja los conceptos contra el catálogo.
 *
 * El RFC del emisor es lo que selecciona la **memoria aprendida**: los mapeos guardados
 * son por proveedor, porque «CC600-24» significa una cosa en La Poblana y otra en
 * cualquier otro sitio.
 */
export const cfdiMatchSchema = z.object({
    /** RFC del emisor del comprobante (normalizado a mayúsculas en el servidor). */
    issuerRfc: z.string().trim().min(1).max(20),
    conceptos: z.array(cfdiConceptoSchema).min(1, { message: ERROR_MESSAGES.CONCEPTS_REQUIRED }).max(500),
});

export type CfdiMatchRequest = z.infer<typeof cfdiMatchSchema>;

/**
 * Un concepto ya resuelto por quien captura, listo para volverse renglón.
 *
 * Las tres salidas de un concepto son excluyentes y aquí se ven como lo que son:
 * - `productId` → renglón con ese producto;
 * - `isDocumentCharge: true` → cargo del documento (flete): renglón sin producto que
 *   **no postea inventario**;
 * - `createProduct: true` → alta con el margen del lote y renglón con el producto nuevo.
 */
export const cfdiResolvedConceptoSchema = cfdiConceptoSchema
    .extend({
        /** Clave del concepto dentro del proveedor; con ella se recuerda la equivalencia. */
        conceptoKey: z.string().trim().min(1).max(300),
        /** Producto emparejado (null = sin emparejar). */
        productId: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }).nullish(),
        /** El concepto es un cargo del documento (flete, maniobras), no mercancía. */
        isDocumentCharge: z.boolean().optional().default(false),
        /** Dar de alta el producto con el margen del lote. Ignorado si ya hay `productId`. */
        createProduct: z.boolean().optional().default(false),
    })
    .strict();

export type CfdiResolvedConceptoRequest = z.infer<typeof cfdiResolvedConceptoSchema>;

/**
 * POST /api/purchases/from-cfdi — crea la compra partiendo del comprobante.
 *
 * Es **el camino principal** del dueño, no el secundario: se llega desde el buzón con el
 * comprobante delante, no desde una compra vacía a la que luego se le pega un XML.
 */
export const createPurchaseFromCfdiSchema = z
    .object({
        /** Id de la compra (identidad en origen: hace el POST reintentable). */
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),

        /**
         * Id del comprobante en el buzón. De ahí sale la cabecera fiscal entera, y por eso
         * es obligatorio: sin comprobante guardado no hay «desde el comprobante».
         */
        cfdiId: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),

        /**
         * Proveedor del catálogo.
         *
         * ⚠️ **No se crea aquí**, a diferencia del escritorio: el alta de proveedor de la
         * nube exige un `code` que solo el usuario decide, y acuñarlo a escondidas metería
         * en el catálogo códigos que nadie eligió. La pantalla resuelve el emisor por RFC y
         * ofrece el alta cuando falta.
         */
        supplierId: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        supplierName: z.string().trim().min(1).max(200),
        supplierTaxId: z.string().trim().max(20).nullish(),

        /** Bodega destino de la entrada. */
        warehouseId: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        locationId: z.string().uuid().nullish(),

        /** INVENTORY | EXPENSE | FIXED_ASSET. Por omisión, lo que diga el UsoCFDI. */
        kind: z.enum(PURCHASE_KINDS).optional(),

        /** Margen con el que nacen los productos dados de alta en el lote. */
        marginPercent: z
            .number()
            .min(0, { message: ERROR_MESSAGES.MARGIN_RANGE })
            .max(1000, { message: ERROR_MESSAGES.MARGIN_RANGE })
            .optional()
            .default(30),

        conceptos: z
            .array(cfdiResolvedConceptoSchema)
            .min(1, { message: ERROR_MESSAGES.CONCEPTS_REQUIRED })
            .max(500),

        /**
         * Guardar las equivalencias concepto → producto para la próxima factura.
         *
         * Por omisión sí: es lo que hace que la segunda factura del mismo proveedor cueste
         * la mitad. Se apaga solo para una captura excepcional que no debe enseñar nada.
         */
        rememberLinks: z.boolean().optional().default(true),
    })
    .strict();

export type CreatePurchaseFromCfdiRequest = z.infer<typeof createPurchaseFromCfdiSchema>;

/** GET /api/purchases/supplier-links?rfc= — la memoria aprendida de un proveedor. */
export const supplierProductLinksQuerySchema = z.object({
    rfc: z.string().trim().min(1).max(20),
});

export type SupplierProductLinksQuery = z.infer<typeof supplierProductLinksQuerySchema>;
