/**
 * @fileoverview Zod schema para recibir una compra (total o parcial).
 * @module Contracts/Purchase/Schemas
 *
 * POST /api/purchases/:id/receive — crea una Recepción, suma a `qtyReceived`
 * de los renglones y postea el movimiento PURCHASE en el inventario.
 *
 * El caso simple (todo llegó, con factura) es UN clic: la web manda todos los
 * renglones pendientes prellenados y `closeMissing: false`. Los contadores solo
 * asoman cuando algo no cuadra.
 */

import { z } from 'zod';

/** Un renglón de esta entrega: cuánto llegó de qué. */
export const receivePurchaseLineSchema = z.object({
    /** Renglón de la compra al que suma. */
    lineId: z.string().uuid(),
    /** Cantidad recibida HOY, unidad de compra. > 0 y ≤ pendiente abierto. */
    quantity: z.number().positive().max(1_000_000),
});

export const receivePurchaseSchema = z.object({
    /**
     * Id de la recepción, GENERADO POR EL CLIENTE: los reintentos de la misma
     * entrega reusan el mismo id y el upsert los hace idempotentes.
     */
    id: z.string().uuid(),
    /** Bodega donde entra (default: la bodega destino de la compra). */
    warehouseId: z.string().uuid().optional(),
    /** Fecha de la entrega (default: hoy). */
    receivedAt: z.coerce.date().optional(),
    /** Remisión o guía del proveedor (muchas veces llega antes que la factura). */
    remittance: z.string().trim().max(100).optional(),
    /** Quién recibió (nombre libre). */
    receivedBy: z.string().trim().max(100).optional(),
    /** Renglones de esta entrega (≥ 1). */
    lines: z.array(receivePurchaseLineSchema).min(1).max(500),
    /**
     * «Cerrar lo que no llegue»: el pendiente abierto de los renglones NO
     * incluidos (o incluidos a medias) se da por perdido a propósito. La
     * pantalla dice QUÉ se cierra antes de confirmar.
     */
    closeMissing: z.boolean().optional().default(false),
    /** Reabre renglones cerrados con faltante antes de recibir. */
    reopenLineIds: z.array(z.string().uuid()).max(500).optional(),
    /** Versión esperada de la compra (OCC). */
    version: z.number().int().min(1),
});

export type ReceivePurchaseRequest = z.infer<typeof receivePurchaseSchema>;
