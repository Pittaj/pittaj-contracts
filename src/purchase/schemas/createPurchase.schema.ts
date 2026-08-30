/**
 * @fileoverview Zod schema para crear una compra desde la web.
 *
 * Réplica del dominio del escritorio (`Pittaj.Domain/Purchasing/Purchase.cs` +
 * `PurchaseLine.cs`), que es donde las invariantes están escritas y probadas:
 *
 * - la compra nace en **BORRADOR** y solo se edita en borrador;
 * - `taxPercent` del renglón es **FRACCIÓN 0-1** (0.16 = 16 %), como en el catálogo
 *   de impuestos; `discountPercent` es 0-100;
 * - un renglón puede ir **sin producto** (flete, maniobras, servicio): entonces
 *   `productId` va nulo y `productName` es la descripción libre. Esos renglones no
 *   postean inventario al recibir.
 *
 * ⚠️ **Los importes NO se aceptan como entrada.** Subtotal, descuento, impuesto y
 * total —del renglón y del documento— los deriva el dominio de la nube con la misma
 * aritmética que `PurchaseLine.Recalculate()` del escritorio. Aceptarlos sería abrir
 * la puerta a que dos plataformas sostengan dos verdades sobre el mismo dinero.
 * (Lo que llega por **sync** es distinto: eso se copia verbatim y jamás se recalcula.)
 *
 * ⚠️ **Los cuatro impuestos desglosados del comprobante** (`trasladoIva`,
 * `trasladoIeps`, `retencionIsr`, `retencionIva`) tampoco van aquí, y no es un olvido:
 * los llena la **importación del CFDI**, que es quien sabe distinguir un IVA de un
 * IEPS. Una captura a mano en el escritorio los deja en cero igual que aquí, y una
 * edición desde la web **no los pisa** — si el CFDI del proveedor ya los puso, ahí
 * siguen.
 *
 * @module Contracts/Purchase
 */

import { z } from 'zod';
import { PURCHASE_KINDS } from './getPurchases.schema.js';

const ERROR_MESSAGES = {
    ID_INVALID_UUID: 'El ID debe ser un UUID válido',
    SUPPLIER_REQUIRED: 'Elige a quién le compraste',
    WAREHOUSE_REQUIRED: 'Indica a qué bodega entra la mercancía',
    LINE_NAME_REQUIRED: 'El renglón necesita un producto o una descripción',
    QUANTITY_POSITIVE: 'La cantidad debe ser mayor que cero',
    COST_NOT_NEGATIVE: 'El costo no puede ser negativo',
    DISCOUNT_RANGE: 'El descuento va de 0 a 100',
    TAX_FRACTION: 'El impuesto es una fracción entre 0 y 1 (0.16 = 16 %)',
    FACTOR_POSITIVE: 'El factor de la unidad debe ser mayor que cero',
    VERSION_MIN: 'La versión debe ser 1 o mayor',
    REASON_REQUIRED: 'Indica el motivo de cancelación',
} as const;

/**
 * Renglón de compra tal como lo captura la pantalla.
 *
 * Espejo de `PurchaseLineInput` del escritorio. El `id` es opcional: si viene, se
 * conserva (editar un borrador no debe reinventar los ids de sus renglones); si no,
 * lo genera la nube.
 */
export const purchaseLineInputSchema = z
    .object({
        /** Id del renglón; se conserva al editar. */
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }).optional(),

        /** Producto del catálogo, o `null` para un renglón de gasto/servicio. */
        productId: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }).nullish(),

        /** Snapshot del nombre del producto, o la descripción libre del gasto. */
        productName: z.string().trim().min(1, { message: ERROR_MESSAGES.LINE_NAME_REQUIRED }).max(200),

        /** Snapshot del código del producto (vacío en un renglón sin producto). */
        productCode: z.string().trim().max(20).optional().default(''),

        /** Cantidad en la UNIDAD DE COMPRA (como la factura: 2 bultos). */
        quantity: z.number().positive({ message: ERROR_MESSAGES.QUANTITY_POSITIVE }),

        /** Costo por esa unidad de compra. */
        unitCost: z.number().min(0, { message: ERROR_MESSAGES.COST_NOT_NEGATIVE }),

        /** Descuento del renglón, 0-100. */
        discountPercent: z
            .number()
            .min(0, { message: ERROR_MESSAGES.DISCOUNT_RANGE })
            .max(100, { message: ERROR_MESSAGES.DISCOUNT_RANGE })
            .optional()
            .default(0),

        /** Impuesto como FRACCIÓN 0-1 (0.16 = 16 %), igual que el catálogo de impuestos. */
        taxPercent: z
            .number()
            .min(0, { message: ERROR_MESSAGES.TAX_FRACTION })
            .max(1, { message: ERROR_MESSAGES.TAX_FRACTION })
            .optional()
            .default(0),

        /** Unidad de compra (null = unidad base). */
        unitName: z.string().trim().max(30).nullish(),

        /** Unidades base por 1 de la unidad de compra (bulto de 25 kg → 25). */
        unitFactor: z.number().positive({ message: ERROR_MESSAGES.FACTOR_POSITIVE }).optional().default(1),

        /**
         * El renglón es un **cargo del documento** (flete, maniobras), no mercancía.
         *
         * Va en la entrada y no solo en la respuesta porque es una decisión de quien
         * captura, no algo derivable: el mismo «FLETE» es un cargo para una tienda y el
         * producto que vende una transportista. Un cargo del documento **no postea
         * inventario** al recibir aunque lleve producto, que es justo lo que el dominio
         * ya comprueba en `receive()`.
         */
        isDocumentCharge: z.boolean().optional().default(false),
    })
    .strict();

export type PurchaseLineInput = z.infer<typeof purchaseLineInputSchema>;

/** Campos de la cabecera, comunes a crear y a editar. */
export const basePurchaseFields = {
    /** Proveedor (obligatorio para guardar el borrador). */
    supplierId: z.string().uuid({ message: ERROR_MESSAGES.SUPPLIER_REQUIRED }),

    /**
     * Snapshot del nombre del proveedor **al momento de comprar**, y no una lectura del
     * catálogo: si mañana el proveedor cambia de razón social, el documento de hoy debe
     * seguir diciendo lo que decía. Lo manda quien captura, igual que `productName` en
     * el renglón de un ticket.
     */
    supplierName: z.string().trim().min(1, { message: ERROR_MESSAGES.SUPPLIER_REQUIRED }).max(200),

    /** RFC snapshot del proveedor (null = sin capturar). */
    supplierTaxId: z.string().trim().max(20).nullish(),

    /** Bodega destino de la entrada. */
    warehouseId: z.string().uuid({ message: ERROR_MESSAGES.WAREHOUSE_REQUIRED }),

    /** Sucursal de la compra (normalmente la de la bodega destino). */
    locationId: z.string().uuid().nullish(),

    /** Naturaleza: inventario, gasto o activo fijo. */
    kind: z.enum(PURCHASE_KINDS).optional().default('INVENTORY'),

    /** Serie-folio del comprobante del proveedor. */
    invoiceFolio: z.string().trim().max(50).nullish(),

    /** UUID del CFDI del proveedor. */
    invoiceUuid: z.string().trim().max(50).nullish(),

    /** Fecha del comprobante. */
    invoiceDate: z.coerce.date().nullish(),

    /** CFDI MétodoPago: "PUE" / "PPD". */
    paymentMethod: z.string().trim().max(5).nullish(),

    /** CFDI FormaPago (clave SAT): "01" efectivo, "03" transferencia, … */
    paymentForm: z.string().trim().max(5).nullish(),

    /** CFDI UsoCFDI del receptor: "G01" mercancías, "G03" gastos, … */
    usoCfdi: z.string().trim().max(5).nullish(),

    /** Divisa del documento. */
    currency: z.string().trim().min(1).max(5).optional().default('MXN'),

    notes: z.string().trim().max(500).nullish(),

    /** Renglones del documento. Un borrador puede guardarse sin ninguno. */
    lines: z.array(purchaseLineInputSchema).optional().default([]),
} as const;

/**
 * POST /api/purchases — crea una compra en BORRADOR.
 *
 * El `id` lo genera el cliente (patrón de la casa: identidad en origen, sync-ready).
 * El **folio lo asigna la nube** sobre su propia serie (`CW-#####`): es el único
 * asignador de esa serie, que es lo que exige el ADR-018.
 */
export const createPurchaseSchema = z
    .object({
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        ...basePurchaseFields,
    })
    .strict();

export type CreatePurchaseRequest = z.infer<typeof createPurchaseSchema>;

export { ERROR_MESSAGES as PURCHASE_WRITE_ERROR_MESSAGES };
