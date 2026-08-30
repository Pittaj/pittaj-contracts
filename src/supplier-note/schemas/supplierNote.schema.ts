/**
 * @fileoverview Zod schemas de escritura y consulta de notas a proveedor (F5.1b).
 * @module Contracts/SupplierNote/Schemas
 *
 * Hasta aquí este módulo solo tenía esquemas de **sync**: la web no podía ni leer las devoluciones.
 *
 * ── Dos cosas que NO se aceptan del cliente, y no es un olvido ──
 *
 * 1. **El costo del renglón.** Se hereda de la compra origen (*exact cost reversing*): si devuelves
 *    tres aceites que entraron a $38.50, salen a $38.50 aunque hoy valgan otra cosa. Lo resuelve el
 *    servidor leyendo el renglón de compra; aceptarlo aquí permitiría deformar la valuación del
 *    inventario tecleando un número.
 * 2. **El monto de una devolución.** Sale de los renglones. Es la invariante
 *    `SUPPLIER_NOTE_RETURN_AMOUNT`, que el escritorio ya tenía escrita.
 */

import { z } from 'zod';
import { SUPPLIER_NOTE_KINDS, SUPPLIER_NOTE_STATUSES } from '../supplierNoteState.js';

const ERROR_MESSAGES = {
    ID_INVALID_UUID: 'El ID debe ser un UUID válido',
    SUPPLIER_REQUIRED: 'Elige a qué proveedor es la nota',
    QUANTITY_POSITIVE: 'La cantidad debe ser mayor que cero',
    AMOUNT_POSITIVE: 'El importe debe ser mayor que cero',
    REASON_REQUIRED: 'Indica el motivo',
    AUTHORIZATION_REQUIRED: 'Captura el folio de autorización que te dio el proveedor',
    PRODUCT_REQUIRED: 'El renglón necesita un producto',
} as const;

/**
 * Renglón a devolver.
 *
 * ⚠️ **Sin `unitCost`.** Lo pone el servidor desde la compra origen. Un renglón sin `purchaseLineId`
 * es la salida de emergencia del diseño («agregar producto que no está en la lista») y ahí sí se
 * captura el costo, porque no hay de dónde heredarlo.
 */
export const supplierNoteLineInputSchema = z
    .object({
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }).optional(),
        productId: z.string().uuid({ message: ERROR_MESSAGES.PRODUCT_REQUIRED }),
        quantity: z.number().positive({ message: ERROR_MESSAGES.QUANTITY_POSITIVE }),

        /** La compra de la que sale el renglón. Null solo en la captura manual. */
        purchaseId: z.string().uuid().nullish(),
        /** Renglón concreto de esa compra. Es contra él que se cuenta lo ya devuelto. */
        purchaseLineId: z.string().uuid().nullish(),

        /**
         * Costo capturado. **Se ignora si hay `purchaseLineId`**: ahí manda el de la compra.
         * Solo sirve para el renglón manual, que no tiene procedencia.
         */
        unitCost: z.number().min(0).optional(),

        /** Motivo de este renglón, además del general. */
        reason: z.string().trim().max(300).nullish(),
    })
    .strict();

export type SupplierNoteLineInputRequest = z.infer<typeof supplierNoteLineInputSchema>;

/** Campos comunes a crear y editar. */
const baseFields = {
    supplierId: z.string().uuid({ message: ERROR_MESSAGES.SUPPLIER_REQUIRED }),
    supplierName: z.string().trim().min(1, { message: ERROR_MESSAGES.SUPPLIER_REQUIRED }).max(200),
    supplierTaxId: z.string().trim().max(20).nullish(),

    /** Bodega de salida. Obligatoria de hecho en `RETURN`, y el dominio lo comprueba al aplicar. */
    warehouseId: z.string().uuid().nullish(),
    /** UUID del CFDI del proveedor, para conciliar. Nunca se timbra nada aquí. */
    invoiceUuid: z.string().trim().max(50).nullish(),
    currency: z.string().trim().max(5).nullish(),
    reason: z.string().trim().max(500).nullish(),

    /** Canje: sale mercancía y el proveedor la repone. Efecto en el saldo: cero. */
    isExchange: z.boolean().optional().default(false),
    expectedReplacementDate: z.coerce.date().nullish(),

    /**
     * Importe. **Solo para `CREDIT` y `DEBIT`**: en una devolución sale de los renglones y el
     * dominio rechaza que se teclee.
     */
    amount: z.number().min(0).optional().default(0),

    lines: z.array(supplierNoteLineInputSchema).max(200).optional().default([]),
};

/** POST /api/supplier-notes */
export const createSupplierNoteSchema = z
    .object({
        /** Id generado por el cliente: hace el POST reintentable sin quemar otro folio. */
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        kind: z.enum(SUPPLIER_NOTE_KINDS),
        ...baseFields,
    })
    .strict();

export type CreateSupplierNoteRequest = z.infer<typeof createSupplierNoteSchema>;

/** PUT /api/supplier-notes/:id — el tipo no se cambia; se duplica y se hace otra. */
export const updateSupplierNoteSchema = z
    .object({
        version: z.number().int().min(1),
        ...baseFields,
    })
    .strict();

export type UpdateSupplierNoteRequest = z.infer<typeof updateSupplierNoteSchema>;

/** Cuerpo de las transiciones que solo necesitan la versión (OCC). */
export const supplierNoteVersionSchema = z.object({ version: z.number().int().min(1) }).strict();
export type SupplierNoteVersionRequest = z.infer<typeof supplierNoteVersionSchema>;

/**
 * POST /api/supplier-notes/:id/cancel
 *
 * El motivo es obligatorio **de verdad**: es lo que se lee dentro de seis meses, y rellenarlo por
 * debajo con «Sin motivo» sería peor que no pedirlo.
 */
export const cancelSupplierNoteSchema = z
    .object({
        version: z.number().int().min(1),
        reason: z.string().trim().min(1, { message: ERROR_MESSAGES.REASON_REQUIRED }).max(500),
    })
    .strict();

export type CancelSupplierNoteRequest = z.infer<typeof cancelSupplierNoteSchema>;

/** POST /api/supplier-notes/:id/authorize — camino largo, primer paso. */
export const authorizeSupplierNoteSchema = z
    .object({
        version: z.number().int().min(1),
        authorizationCode: z
            .string()
            .trim()
            .min(1, { message: ERROR_MESSAGES.AUTHORIZATION_REQUIRED })
            .max(60),
        expiresAt: z.coerce.date().nullish(),
    })
    .strict();

export type AuthorizeSupplierNoteRequest = z.infer<typeof authorizeSupplierNoteSchema>;

/** GET /api/supplier-notes */
export const getSupplierNotesSchema = z.object({
    search: z.string().trim().max(120).optional(),
    kind: z.enum(SUPPLIER_NOTE_KINDS).optional(),
    status: z.enum(SUPPLIER_NOTE_STATUSES).optional(),
    supplierId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type GetSupplierNotesRequest = z.infer<typeof getSupplierNotesSchema>;

/**
 * GET /api/supplier-notes/returnable — la pantalla de origen.
 *
 * La consulta que **no existía en ninguna de las dos plataformas** y es la pieza de más valor de
 * esta orden: eliges proveedor y ves lo que le compraste con lo ya devuelto descontado.
 */
export const getReturnableLinesSchema = z.object({
    supplierId: z.string().uuid({ message: ERROR_MESSAGES.SUPPLIER_REQUIRED }),
    search: z.string().trim().max(120).optional(),
    /** Compras recibidas desde esta fecha («últimas 12 semanas» en la pantalla). */
    receivedFrom: z.coerce.date().optional(),
    locationId: z.string().uuid().optional(),
    /** Ocultar lo que ya no se puede devolver. Por omisión sí: la casilla nace marcada. */
    onlyReturnable: z.coerce.boolean().optional().default(true),
    limit: z.coerce.number().int().min(1).max(500).optional().default(200),
    /** Excluir lo apartado por ESTA nota, al editarla. */
    excludeNoteId: z.string().uuid().optional(),
});

export type GetReturnableLinesRequest = z.infer<typeof getReturnableLinesSchema>;

/** Param `:id` de las rutas de nota. */
export const supplierNoteIdParamSchema = z.object({
    id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
});
