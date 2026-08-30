/**
 * @fileoverview Zod schema para revertir una recepción concreta.
 * @module Contracts/Purchase/Schemas
 *
 * POST /api/purchases/:purchaseId/receptions/:receptionId/reverse — revierte
 * ESA entrega sin tocar las demás: resta de `qtyReceived`, postea el
 * contramovimiento de inventario y, si era la última, el documento vuelve a
 * admitir edición.
 */

import { z } from 'zod';

export const reverseReceptionSchema = z.object({
    purchaseId: z.string().uuid(),
    receptionId: z.string().uuid(),
});

export type ReverseReceptionParams = z.infer<typeof reverseReceptionSchema>;

/** Cuerpo del reverso: la versión esperada de la compra (OCC). */
export const reverseReceptionBodySchema = z.object({
    version: z.number().int().min(1),
});

export type ReverseReceptionBody = z.infer<typeof reverseReceptionBodySchema>;

export const listReceptionsSchema = z.object({
    purchaseId: z.string().uuid(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type ListReceptionsParams = z.infer<typeof listReceptionsSchema>;
