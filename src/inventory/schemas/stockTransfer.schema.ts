/**
 * @fileoverview Traspasos entre bodegas: el documento.
 * @module Contracts/Inventory/Schemas/StockTransfer
 *
 * ── Por qué un documento y no dos movimientos ──
 *
 * Hasta el 2026-09-19 un traspaso era un par de movimientos del kárdex (salida + entrada) con un
 * id compartido, escritos en el mismo instante. Entre dos bodegas del mismo local eso alcanza;
 * entre Huehuetlán y Chiautla no: la mercancía **viaja**, sale de una bodega y tarda en llegar a
 * la otra, y mientras tanto no está en ninguna. Sin documento, esa mercancía en camino no existía
 * para nadie, y la sucursal destino no tenía qué recibir ni con qué comparar lo que llegó.
 *
 * ── Los estados ──
 *
 * `DRAFT` (se arma) → `SENT` (salió del origen; en camino) → `RECEIVED` (entró en destino, con las
 * cantidades que de verdad llegaron). `CANCELLED` desde borrador o enviado; cancelar un enviado
 * devuelve la mercancía al origen. **Enviar y recibir** en un paso existe para las bodegas del
 * mismo local, que es lo que hacía el formulario viejo del escritorio.
 */

import { z } from 'zod';

export const STOCK_TRANSFER_STATUSES = ['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED'] as const;
export type StockTransferStatus = (typeof STOCK_TRANSFER_STATUSES)[number];

/** De dónde nació el traspaso. Referencia blanda: el documento origen vive en Compras. */
export const STOCK_TRANSFER_ORIGINS = ['REQUEST', 'REPLENISHMENT', 'MANUAL'] as const;
export type StockTransferOrigin = (typeof STOCK_TRANSFER_ORIGINS)[number];

const lineSchema = z
    .object({
        /** Id generado por el cliente: los renglones viajan por sync y necesitan identidad estable. */
        id: z.string().uuid().optional(),
        productId: z.string().uuid(),
        productName: z.string().trim().min(1).max(200),
        productCode: z.string().trim().max(50).nullish(),
        quantity: z.number().positive('Traspasar cero no es traspasar'),
    })
    .strict();

/** GET /api/stock-transfers */
export const getStockTransfersSchema = z.object({
    status: z.enum(STOCK_TRANSFER_STATUSES).optional(),
    fromWarehouseId: z.string().uuid().optional(),
    toWarehouseId: z.string().uuid().optional(),
    /** Cualquiera de las dos bodegas: «lo que toca a Chiautla», salga o entre. */
    warehouseId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    /** Folio, producto o folio de la solicitud de origen. */
    search: z.string().trim().max(100).optional(),
    /** Por defecto los cancelados no aparecen: son ruido en la lista de trabajo. */
    includeCancelled: z.coerce.boolean().optional().default(false),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

/** POST /api/stock-transfers */
export const createStockTransferSchema = z
    .object({
        /** Id generado por el cliente: identidad en origen, hace el POST reintentable. */
        id: z.string().uuid('Id de traspaso inválido'),
        fromWarehouseId: z.string().uuid('Bodega de origen inválida'),
        toWarehouseId: z.string().uuid('Bodega de destino inválida'),
        note: z.string().trim().max(1000).nullish(),
        originKind: z.enum(STOCK_TRANSFER_ORIGINS).optional().default('MANUAL'),
        originDocId: z.string().max(36).nullish(),
        originDocNumber: z.string().max(40).nullish(),
        lines: z.array(lineSchema).min(1, 'Un traspaso sin renglones no mueve nada').max(200),
        /**
         * Enviar de una vez. Y `receiveNow` además lo recibe en el mismo paso: para dos bodegas
         * del mismo local, donde no hay camino que recorrer.
         */
        send: z.boolean().optional().default(false),
        receiveNow: z.boolean().optional().default(false),
        /** Quién lo hace, con nombre: el documento lo enseña y el token solo trae el id. */
        actorName: z.string().trim().max(200).nullish(),
    })
    .refine((v) => v.fromWarehouseId !== v.toWarehouseId, {
        message: 'El origen y el destino son la misma bodega: no hay nada que mover.',
        path: ['toWarehouseId'],
    });

/** PUT /api/stock-transfers/:id — solo en borrador. */
export const updateStockTransferSchema = z
    .object({
        fromWarehouseId: z.string().uuid(),
        toWarehouseId: z.string().uuid(),
        note: z.string().trim().max(1000).nullish(),
        lines: z.array(lineSchema).min(1).max(200),
        version: z.number().int().min(1),
    })
    .refine((v) => v.fromWarehouseId !== v.toWarehouseId, {
        message: 'El origen y el destino son la misma bodega: no hay nada que mover.',
        path: ['toWarehouseId'],
    });

/** POST /api/stock-transfers/:id/send */
export const sendStockTransferSchema = z.object({
    version: z.number().int().min(1),
    /** Mismo local: sale y entra en un paso. */
    receiveNow: z.boolean().optional().default(false),
    actorName: z.string().trim().max(200).nullish(),
});

/**
 * POST /api/stock-transfers/:id/receive
 *
 * Sin `lines` = llegó todo. Con `lines`, lo que de verdad llegó de cada renglón; lo que falte
 * queda anotado en el documento, no se inventa una entrada que no ocurrió.
 */
export const receiveStockTransferSchema = z.object({
    version: z.number().int().min(1),
    actorName: z.string().trim().max(200).nullish(),
    lines: z
        .array(
            z
                .object({
                    lineId: z.string().uuid(),
                    receivedQuantity: z.number().min(0),
                })
                .strict()
        )
        .optional(),
});

/** POST /api/stock-transfers/:id/cancel */
export const cancelStockTransferSchema = z.object({
    version: z.number().int().min(1),
    reason: z.string().trim().min(1, 'Di por qué se cancela').max(1000),
});

export const stockTransferIdParamSchema = z.object({ id: z.string().uuid() });

export type GetStockTransfersQuery = z.infer<typeof getStockTransfersSchema>;
export type CreateStockTransferRequest = z.infer<typeof createStockTransferSchema>;
export type UpdateStockTransferRequest = z.infer<typeof updateStockTransferSchema>;
export type SendStockTransferRequest = z.infer<typeof sendStockTransferSchema>;
export type ReceiveStockTransferRequest = z.infer<typeof receiveStockTransferSchema>;
export type CancelStockTransferRequest = z.infer<typeof cancelStockTransferSchema>;
