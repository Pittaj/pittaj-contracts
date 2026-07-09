/**
 * @fileoverview Zod schema para procesar una devolución.
 * @module Contracts/SalesReturn
 *
 * POST /api/sales-returns/process — crea el documento de devolución, reingresa inventario
 * (líneas marcadas restock) y resuelve el importe en efectivo (CASH → CASH_OUT/REFUND sobre
 * la sesión de caja) o en nota de crédito (CREDIT_NOTE → emite NC y la enlaza).
 *
 * Espejo del ProcessReturnCommand desktop (Pittaj.Application/SalesReturns/Commands): la
 * línea lleva productId/productName/quantity/unitPrice/restock (igual que ReturnLineInput).
 * sessionId es OBLIGATORIO cuando resolution = CASH (el reembolso necesita una caja abierta).
 */

import { z } from 'zod';
import { RETURN_RESOLUTIONS } from '../primitives/salesReturnPrimitives';

/** Renglón de la devolución en el body del comando. */
export const processReturnLineSchema = z.object({
    productId: z.string().min(1, 'El producto es obligatorio'),
    productName: z.string().min(1, 'El nombre del producto es obligatorio'),
    quantity: z.number().positive('La cantidad debe ser mayor que 0'),
    unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
    /** true = reingresa a inventario (movimiento IN/RETURN). */
    restock: z.boolean().default(true),
});

/** Body de POST /api/sales-returns/process. */
export const processReturnSchema = z
    .object({
        /** Ticket origen (opcional; null/omitido = devolución sin ticket ligado). */
        originTicketId: z.string().optional(),
        /** Resolución del importe: CASH | CREDIT_NOTE. */
        resolution: z.enum(RETURN_RESOLUTIONS),
        /** Sesión de caja (obligatoria si resolution = CASH). */
        sessionId: z.string().optional(),
        /** Cliente para la nota de crédito (opcional). */
        customerId: z.string().optional(),
        /** Motivo de la devolución (texto libre). */
        reason: z.string().max(200).optional().default(''),
        /** Moneda (default MXN). */
        currency: z.string().min(3).max(5).optional().default('MXN'),
        /** Renglones devueltos (al menos uno). */
        lines: z.array(processReturnLineSchema).min(1, 'La devolución no tiene líneas'),
    })
    .superRefine((val, ctx) => {
        if (val.resolution === 'CASH' && (!val.sessionId || val.sessionId.length === 0)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['sessionId'],
                message: 'El reembolso en efectivo requiere una sesión de caja',
            });
        }
    });

export type ProcessReturnLine = z.infer<typeof processReturnLineSchema>;
export type ProcessReturnBody = z.infer<typeof processReturnSchema>;
