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
        /** Resolución del importe: CASH | CREDIT_NOTE | TRANSFER. */
        resolution: z.enum(RETURN_RESOLUTIONS),
        /**
         * Sesión de caja. Obligatoria en CASH (de ahí sale el efectivo) y en TRANSFER: aunque la
         * transferencia no mueva el cajón, la devolución sigue siendo un acto del turno y de la
         * sesión salen el operador y la sucursal que la póliza necesita.
         */
        sessionId: z.string().optional(),
        /**
         * Forma de pago con la que se envió el reembolso. **Obligatoria en TRANSFER y prohibida en
         * las otras dos.**
         *
         * Se guarda el método concreto y no solo el tipo porque la contabilidad resuelve la cuenta
         * por método antes que por tipo: dos cuentas bancarias son las dos TRANSFER y el tenant
         * puede querer mapearlas por separado. Y se prohíbe en CASH porque si se permitiera, un
         * mapeo por método podría mandar un reembolso «en efectivo» a una cuenta que no es la caja
         * — y entonces CASH dejaría de significar «salió del cajón».
         */
        refundMethodId: z.string().optional(),
        refundMethodType: z.string().max(20).optional(),
        refundMethodName: z.string().max(100).optional(),
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
    /**
     * Las reglas cruzadas van en el schema **y no en el handler**: es la clase de invariante que
     * se olvida en el segundo llamador, y aquí ya hay dos (la pantalla web y el push del
     * escritorio).
     */
    .superRefine((val, ctx) => {
        const sinSesion = !val.sessionId || val.sessionId.length === 0;
        if (val.resolution === 'CASH' && sinSesion) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['sessionId'],
                message: 'El reembolso en efectivo requiere una sesión de caja',
            });
        }
        if (val.resolution === 'TRANSFER') {
            if (sinSesion) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['sessionId'],
                    message: 'La devolución requiere una sesión de caja abierta',
                });
            }
            if (!val.refundMethodId || val.refundMethodId.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['refundMethodId'],
                    message:
                        'El reembolso por transferencia necesita la cuenta o forma de pago con la que se envía',
                });
            }
        } else if (val.refundMethodId && val.refundMethodId.length > 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['refundMethodId'],
                message: `Una devolución resuelta como ${val.resolution} no lleva forma de pago de reembolso`,
            });
        }
    });

export type ProcessReturnLine = z.infer<typeof processReturnLineSchema>;
export type ProcessReturnBody = z.infer<typeof processReturnSchema>;
