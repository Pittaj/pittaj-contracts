/**
 * @fileoverview Peticiones de las cotizaciones.
 * @module Contracts/Purchase/Schemas/QuoteRequest
 */

import { z } from 'zod';

export const getQuoteRequestsSchema = z.object({
    status: z.enum(['DRAFT', 'REQUESTING', 'CLOSED', 'CANCELLED']).optional(),
    limit: z.coerce.number().int().min(1).max(300).optional().default(100),
});

const lineaSchema = z
    .object({
        productId: z.string().uuid(),
        productName: z.string().trim().min(1).max(200),
        quantity: z.number().positive('Preguntar por cero no es preguntar'),
    })
    .strict();

export const createQuoteRequestSchema = z.object({
    /** Id generado por el cliente: identidad en origen, hace el POST reintentable. */
    id: z.string().uuid(),
    neededBy: z.string().optional().nullable(),
    note: z.string().trim().max(1000).nullish(),
    lines: z.array(lineaSchema).min(1, 'Una solicitud sin renglones no pregunta nada').max(200),
    /** A quién se le va a preguntar. Se puede añadir más después. */
    suppliers: z
        .array(
            z
                .object({
                    supplierId: z.string().uuid(),
                    supplierName: z.string().trim().min(1).max(200),
                })
                .strict()
        )
        .max(20),
});

export const updateQuoteRequestSchema = z.object({
    neededBy: z.string().optional().nullable(),
    note: z.string().trim().max(1000).nullish(),
    /**
     * ⚠️ Ya pidiendo precios, **solo cambian las cantidades**: quitar o añadir un producto después
     * de haber preguntado dejaría respuestas que hablan de una lista que ya no existe. El dominio
     * lo rechaza.
     */
    lines: z.array(lineaSchema).min(1).max(200),
});

export const captureQuoteResponseSchema = z.object({
    prices: z
        .array(
            z
                .object({
                    productId: z.string().uuid(),
                    /** Un cero no es un precio: es «no me cotizó esto», y el dominio lo descarta. */
                    unitPrice: z.number().min(0),
                })
                .strict()
        )
        .min(1),
    validUntil: z.string().optional().nullable(),
    deliveryDays: z.number().int().min(0).max(365).optional().nullable(),
    paymentTerms: z.string().trim().max(100).nullish(),
    note: z.string().trim().max(1000).nullish(),
});

export const declineQuoteSchema = z.object({
    reason: z.string().trim().max(500).nullish(),
});

/** El id de la copia lo pone el cliente, igual que el alta: reintentar el POST no duplica. */
export const duplicateQuoteSchema = z.object({
    id: z.string().uuid(),
});

export const inviteSupplierSchema = z.object({
    supplierId: z.string().uuid(),
    supplierName: z.string().trim().min(1).max(200),
});

export const createPurchasesFromQuoteSchema = z.object({
    /**
     * Qué renglón se le compra a quién.
     *
     * Se manda explícito y no se deduce del mejor precio: la pantalla propone el reparto, pero
     * quien decide puede preferir una sola entrega aunque cueste noventa pesos más — y esa
     * decisión es suya, no del cálculo.
     */
    asignaciones: z
        .array(
            z
                .object({
                    productId: z.string().uuid(),
                    supplierId: z.string().uuid(),
                })
                .strict()
        )
        .min(1),
    warehouseId: z.string().uuid('Bodega inválida'),
    locationId: z.string().uuid().nullish(),
});

export type GetQuoteRequestsQuery = z.infer<typeof getQuoteRequestsSchema>;
export type CreateQuoteRequestRequest = z.infer<typeof createQuoteRequestSchema>;
export type UpdateQuoteRequestRequest = z.infer<typeof updateQuoteRequestSchema>;
export type CaptureQuoteResponseRequest = z.infer<typeof captureQuoteResponseSchema>;
export type CreatePurchasesFromQuoteRequest = z.infer<typeof createPurchasesFromQuoteSchema>;
export type InviteSupplierRequest = z.infer<typeof inviteSupplierSchema>;
export type DuplicateQuoteRequest = z.infer<typeof duplicateQuoteSchema>;
