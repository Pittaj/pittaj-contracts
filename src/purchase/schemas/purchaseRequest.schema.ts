/**
 * @fileoverview Peticiones de las sucursales.
 * @module Contracts/Purchase/Schemas/PurchaseRequest
 */

import { z } from 'zod';

export const getPurchaseRequestsSchema = z.object({
    /** Sin filtro = las pendientes, que es la pregunta de la pantalla. */
    status: z.enum(['PENDIENTE', 'ATENDIDA', 'RECHAZADA']).optional(),
    locationId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(300).optional().default(100),
});

export const createPurchaseRequestSchema = z.object({
    /** Id generado por el cliente: identidad en origen, hace el POST reintentable. */
    id: z.string().uuid('Id de petición inválido'),
    /** Desde qué sucursal se pide. */
    locationId: z.string().uuid().nullish(),
    locationName: z.string().trim().max(200).nullish(),
    /** «ya no tenemos nada». Opcional, pero es lo que explica la urgencia. */
    note: z.string().trim().max(1000).nullish(),
    lines: z
        .array(
            z
                .object({
                    productId: z.string().uuid(),
                    productName: z.string().trim().min(1).max(200),
                    quantity: z.number().positive('Pedir cero no es pedir'),
                })
                .strict()
        )
        .min(1, 'Una petición sin renglones no pide nada')
        .max(100),
});

export const rejectPurchaseRequestSchema = z.object({
    /**
     * Por qué no se surte. **Obligatorio.**
     *
     * Quien pidió merece saber por qué no llegó, y sin eso vuelve a pedirlo la semana siguiente.
     */
    reason: z.string().trim().min(1, 'Di por qué no se surte').max(1000),
});

export const resolveWithTransferSchema = z.object({
    /** De qué bodega sale la mercancía. */
    fromWarehouseId: z.string().uuid('Bodega de origen inválida'),
    /** A cuál entra: la de quien pidió. */
    toWarehouseId: z.string().uuid('Bodega de destino inválida'),
    /**
     * Qué se traspasa y cuánto.
     *
     * Se manda explícito y no se deduce de los renglones: casi siempre se manda **lo que hay**, no
     * lo que se pidió, y obligar a mandar todo o nada dejaría la petición esperando por completo
     * cuando podía resolverse a medias hoy mismo.
     */
    lines: z
        .array(
            z.object({ productId: z.string().uuid(), quantity: z.number().positive() }).strict()
        )
        .min(1),
});

export type GetPurchaseRequestsQuery = z.infer<typeof getPurchaseRequestsSchema>;
export type CreatePurchaseRequestRequest = z.infer<typeof createPurchaseRequestSchema>;
export type RejectPurchaseRequestRequest = z.infer<typeof rejectPurchaseRequestSchema>;
export type ResolveWithTransferRequest = z.infer<typeof resolveWithTransferSchema>;
