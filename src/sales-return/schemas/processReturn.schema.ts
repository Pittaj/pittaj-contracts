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
 *
 * **El snapshot fiscal de la línea es opcional a propósito.** Quien procesa la devolución no
 * tiene por qué saber de impuestos: si no lo manda, el handler lo **deriva del ticket origen**,
 * que es la fuente autorizada (ADR-006). Exigirlo en el contrato obligaría a cambiar las dos
 * pantallas de devolución para copiar un dato que el sistema ya tiene.
 */

import { z } from 'zod';
import { RETURN_RESOLUTIONS } from '../primitives/salesReturnPrimitives.js';

/** Renglón de la devolución en el body del comando. */
export const processReturnLineSchema = z.object({
    productId: z.string().min(1, 'El producto es obligatorio'),
    productName: z.string().min(1, 'El nombre del producto es obligatorio'),
    quantity: z.number().positive('La cantidad debe ser mayor que 0'),
    unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
    /** true = reingresa a inventario (movimiento IN/RETURN). */
    restock: z.boolean().default(true),

    // ── Snapshot fiscal (ADR-006). Opcional: si no viene, se deriva del ticket origen. ──
    /** Clave del impuesto de la línea, copiada del ticket ('002' = IVA). */
    taxCode: z.string().max(10).optional(),
    /** Tasa aplicada, en por ciento (16 = 16%). */
    taxPercent: z.number().min(0).optional(),
    /** Importe del impuesto que se devuelve, por la cantidad devuelta. */
    taxAmount: z.number().min(0).optional(),
    /** true = el precio unitario ya trae el impuesto dentro. */
    taxIncluded: z.boolean().optional(),
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
        /**
         * Sucursal donde se procesa. Es lo que ata la devolución a una empresa (RFC) y por
         * tanto al libro contable donde va: sin ella el documento no se puede contabilizar.
         * Opcional en el contrato porque el desktop la conoce por su contexto operativo.
         */
        locationId: z.string().optional(),
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
