/**
 * @fileoverview Rastreo por lote (con caducidad) y por número de serie.
 * @module Contracts/Inventory/Schemas/StockLot
 *
 * ── Qué se rastrea y cómo se decide ──
 *
 * Cada producto elige su rastreo en `inventoryConfig.tracking` (ver {@link PRODUCT_TRACKING_MODES}):
 *
 * - `NONE` — lo de hoy: la existencia es un número por bodega.
 * - `LOT` — cada entrada nace en un lote (número, fecha de fabricación, caducidad). Farmacia,
 *   alimentos, químicos, cosmética: lo que caduca o lo que hay que poder retirar del mercado.
 * - `SERIAL` — cada pieza tiene número propio. Celulares, electrodomésticos, herramienta con
 *   garantía. La cantidad de un movimiento es exactamente el número de series que lleva.
 *
 * ── El lote NO guarda existencia ──
 *
 * Mismo mandato que la existencia (§4): el saldo de un lote se **deriva** de los movimientos que
 * lo nombran (`stock_movements.lot_id`). El lote es un catálogo (número, fechas, estado); cuánto
 * queda de él en cada bodega es una proyección, igual que `stock_items`.
 *
 * ── Qué lote sale ──
 *
 * La salida sin lote elegido toma por **FEFO** (el que caduca primero) o **FIFO** (el que entró
 * primero), según `inventorySettings.lotPickingPolicy`. Una salida puede partirse en varios lotes:
 * el movimiento se escribe uno por lote, con el mismo `sourceDocId`.
 *
 * ── Identidad ──
 *
 * El número de lote es único por producto, no por cuenta: dos proveedores pueden usar «L2409».
 * El id es generado en origen (sync-ready) para que el escritorio pueda recibir mercancía sin red.
 */

import { z } from 'zod';

/** Cómo se rastrea un producto. Vive en `Product.inventoryConfig.tracking`. */
export const PRODUCT_TRACKING_MODES = ['NONE', 'LOT', 'SERIAL'] as const;
export type ProductTrackingMode = (typeof PRODUCT_TRACKING_MODES)[number];

export const PRODUCT_TRACKING_MODE_LABELS: Readonly<Record<ProductTrackingMode, string>> = {
    NONE: 'Sin rastreo',
    LOT: 'Por lote',
    SERIAL: 'Por número de serie',
};

/**
 * Estado del lote. Un lote en cuarentena o retirado **no sale** por venta ni por traspaso normal;
 * solo por ajuste (merma, devolución a proveedor).
 */
export const STOCK_LOT_STATUSES = [
    'AVAILABLE',
    /** Retenido: esperando revisión de calidad, o sospechoso. */
    'QUARANTINE',
    /** Retiro de mercado: el proveedor o la autoridad lo pidieron. */
    'RECALLED',
    /** Caducado. Lo pone el sistema al pasar la fecha; no se captura a mano. */
    'EXPIRED',
] as const;
export type StockLotStatus = (typeof STOCK_LOT_STATUSES)[number];

export const STOCK_LOT_STATUS_LABELS: Readonly<Record<StockLotStatus, string>> = {
    AVAILABLE: 'Disponible',
    QUARANTINE: 'En cuarentena',
    RECALLED: 'Retirado',
    EXPIRED: 'Caducado',
};

/** Estado de una pieza con número de serie. Se deriva del último movimiento que la nombra. */
export const SERIAL_NUMBER_STATUSES = [
    /** En una bodega, disponible. */
    'IN_STOCK',
    /** Salió por venta: tiene cliente y garantía. */
    'SOLD',
    /** En camino entre bodegas (traspaso enviado sin recibir). */
    'IN_TRANSIT',
    /** Devuelta al proveedor. */
    'RETURNED_TO_SUPPLIER',
    /** Dada de baja por ajuste (robo, daño). */
    'WRITTEN_OFF',
] as const;
export type SerialNumberStatus = (typeof SERIAL_NUMBER_STATUSES)[number];

/**
 * Cómo se asigna un lote en una salida. Va en el renglón del documento que saca mercancía
 * (traspaso, ajuste, venta) cuando el producto se rastrea por lote.
 */
export const lotAllocationSchema = z
    .object({
        lotId: z.string().uuid(),
        /** Snapshot para leer el documento sin ir al catálogo. */
        lotNumber: z.string().trim().min(1).max(60),
        quantity: z.number().positive(),
    })
    .strict();
export type LotAllocationInput = z.infer<typeof lotAllocationSchema>;

/**
 * Un lote que NACE en una entrada (recepción de compra, carga inicial, ajuste positivo,
 * producción). Si ya existe el número para ese producto, se reusa: no se duplica.
 */
export const incomingLotSchema = z
    .object({
        /** Id generado en origen; el servidor lo respeta si el número es nuevo. */
        lotId: z.string().uuid().optional(),
        lotNumber: z.string().trim().min(1).max(60),
        manufacturedAt: z.coerce.date().nullish(),
        expiresAt: z.coerce.date().nullish(),
        quantity: z.number().positive(),
    })
    .strict();
export type IncomingLotInput = z.infer<typeof incomingLotSchema>;

/** Series de una entrada o salida. La cantidad del renglón debe ser igual a su número. */
export const serialNumbersSchema = z
    .array(z.string().trim().min(1).max(80))
    .max(2000)
    .refine((s) => new Set(s.map((x) => x.toUpperCase())).size === s.length, {
        message: 'Hay un número de serie repetido.',
    });

/** GET /api/stock-lots */
export const getStockLotsSchema = z.object({
    productId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    status: z.enum(STOCK_LOT_STATUSES).optional(),
    /** Caducan dentro de N días (incluye los ya caducados con saldo). */
    expiresWithinDays: z.coerce.number().int().min(0).max(3650).optional(),
    /** Por defecto se ocultan los lotes agotados: son historia, no trabajo. */
    includeEmpty: z.coerce.boolean().optional().default(false),
    /** Número de lote o producto. */
    search: z.string().trim().max(100).optional(),
    sort: z.enum(['expiresAt', 'receivedAt', 'lotNumber']).optional().default('expiresAt'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

/** PATCH /api/stock-lots/:id — solo lo que se puede corregir de un lote. */
export const updateStockLotSchema = z.object({
    /** Corregir un número mal capturado. No cambia la identidad: los movimientos siguen al id. */
    lotNumber: z.string().trim().min(1).max(60).optional(),
    manufacturedAt: z.coerce.date().nullish(),
    expiresAt: z.coerce.date().nullish(),
    note: z.string().trim().max(1000).nullish(),
    version: z.number().int().min(1),
});

/**
 * POST /api/stock-lots/:id/status — poner o quitar cuarentena, marcar retiro.
 * `EXPIRED` no se elige: lo pone la fecha.
 */
export const changeStockLotStatusSchema = z.object({
    status: z.enum(['AVAILABLE', 'QUARANTINE', 'RECALLED']),
    reason: z.string().trim().min(1, 'Di por qué').max(1000),
    version: z.number().int().min(1),
    actorName: z.string().trim().max(200).nullish(),
});

/** GET /api/serial-numbers */
export const getSerialNumbersSchema = z.object({
    productId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    status: z.enum(SERIAL_NUMBER_STATUSES).optional(),
    /** Número de serie (exacto o prefijo), producto o folio del documento. */
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export type GetStockLotsQuery = z.infer<typeof getStockLotsSchema>;
export type UpdateStockLotRequest = z.infer<typeof updateStockLotSchema>;
export type ChangeStockLotStatusRequest = z.infer<typeof changeStockLotStatusSchema>;
export type GetSerialNumbersQuery = z.infer<typeof getSerialNumbersSchema>;
