/**
 * @fileoverview Reservas: mercancía comprometida que todavía no sale.
 * @module Contracts/Inventory/Schemas/StockReservation
 *
 * ── Por qué hace falta ──
 *
 * `StockItemResponse.reserved` existe desde el principio y nadie lo escribe. Mientras tanto un
 * apartado, un pedido de cliente o un traspaso en borrador prometen piezas que el POS sigue
 * vendiendo como libres. La reserva es el registro de esa promesa; **disponible = existencia −
 * reservado**, y es disponible lo que debe mirar quien vende o promete.
 *
 * ── No es un movimiento ──
 *
 * Reservar no mueve mercancía ni valor: no toca el kárdex. Es un documento vivo con estado. El
 * `reserved` de la existencia se **deriva** de las reservas activas (§4 otra vez): no se suma ni se
 * resta a mano.
 *
 * ── Quién reserva ──
 *
 * Casi siempre otro documento, al pasar a un estado que compromete (el apartado al abrirse, el
 * pedido al confirmarse, la orden de producción al liberarse). Se cierra sola cuando ese documento
 * saca la mercancía (`FULFILLED`) o se cancela (`RELEASED`). Las manuales existen para «apártame
 * estas dos cajas» sin documento; caducan en `expiresAt`.
 */

import { z } from 'zod';
import { lotAllocationSchema } from './stockLot.schema.js';

export const STOCK_RESERVATION_SOURCES = ['LAYAWAY', 'SALES_ORDER', 'TRANSFER', 'PRODUCTION', 'MANUAL'] as const;
export type StockReservationSource = (typeof STOCK_RESERVATION_SOURCES)[number];

export const STOCK_RESERVATION_SOURCE_LABELS: Readonly<Record<StockReservationSource, string>> = {
    LAYAWAY: 'Apartado',
    SALES_ORDER: 'Pedido de cliente',
    TRANSFER: 'Traspaso',
    PRODUCTION: 'Orden de producción',
    MANUAL: 'Manual',
};

export const STOCK_RESERVATION_STATUSES = [
    'ACTIVE',
    /** Salió la mercancía: el documento origen la despachó. */
    'FULFILLED',
    /** Se soltó sin salir: el documento se canceló, venció, o alguien la liberó. */
    'RELEASED',
] as const;
export type StockReservationStatus = (typeof STOCK_RESERVATION_STATUSES)[number];

/** POST /api/stock-reservations — reserva manual (las de documentos las crea su módulo). */
export const createStockReservationSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    productName: z.string().trim().min(1).max(200),
    warehouseId: z.string().uuid(),
    quantity: z.number().positive(),
    /** Si el producto va por lote y se quiere apartar uno en concreto. */
    lots: z.array(lotAllocationSchema).max(50).optional(),
    /** Para quién (texto libre o cliente). */
    customerId: z.string().uuid().nullish(),
    holderName: z.string().trim().max(200).nullish(),
    note: z.string().trim().max(1000).nullish(),
    /** Una manual sin fecha de vencimiento se queda para siempre: se pide. */
    expiresAt: z.coerce.date(),
    actorName: z.string().trim().max(200).nullish(),
});

/** POST /api/stock-reservations/:id/release */
export const releaseStockReservationSchema = z.object({
    version: z.number().int().min(1),
    reason: z.string().trim().min(1, 'Di por qué se libera').max(1000),
    actorName: z.string().trim().max(200).nullish(),
});

/** GET /api/stock-reservations */
export const getStockReservationsSchema = z.object({
    productId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    sourceType: z.enum(STOCK_RESERVATION_SOURCES).optional(),
    status: z.enum(STOCK_RESERVATION_STATUSES).optional().default('ACTIVE'),
    /** Vencen en N días (solo activas). */
    expiresWithinDays: z.coerce.number().int().min(0).max(365).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export type CreateStockReservationRequest = z.infer<typeof createStockReservationSchema>;
export type ReleaseStockReservationRequest = z.infer<typeof releaseStockReservationSchema>;
export type GetStockReservationsQuery = z.infer<typeof getStockReservationsSchema>;
