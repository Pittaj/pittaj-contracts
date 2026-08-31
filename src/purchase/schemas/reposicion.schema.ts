/**
 * @fileoverview Peticiones de «qué reponer».
 * @module Contracts/Purchase/Schemas/Reposicion
 */

import { z } from 'zod';

export const getReposicionSchema = z.object({
    /** Bodega que se está mirando. Sin ella, la existencia de todas juntas. */
    warehouseId: z.string().uuid().optional(),
    /**
     * Sobre cuántas semanas se promedia la venta.
     *
     * Ocho por omisión: dos meses. Menos y una semana rara (un puente, una fiesta del pueblo)
     * mueve el promedio entero; más y deja de reflejar la temporada en la que estás.
     */
    semanas: z.coerce.number().int().min(2).max(52).optional().default(8),
    /** Incluir también lo que NO está bajo mínimo. Apagado: la pregunta es qué falta. */
    incluirConExistencia: z.coerce.boolean().optional().default(false),
    limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});

export const getMinimosSugeridosSchema = z.object({
    semanas: z.coerce.number().int().min(2).max(52).optional().default(8),
    /** Solo los que hoy no tienen mínimo. Apagado incluye los que ya lo tienen, para revisarlo. */
    soloSinMinimo: z.coerce.boolean().optional().default(true),
    limit: z.coerce.number().int().min(1).max(1000).optional().default(500),
});

export const aplicarMinimosSchema = z.object({
    items: z
        .array(
            z
                .object({
                    productId: z.string().uuid(),
                    minimo: z.number().min(0),
                    maximo: z.number().min(0),
                })
                .strict()
        )
        .min(1)
        .max(1000),
});

export type GetReposicionQuery = z.infer<typeof getReposicionSchema>;
export type GetMinimosSugeridosQuery = z.infer<typeof getMinimosSugeridosSchema>;
export type AplicarMinimosRequest = z.infer<typeof aplicarMinimosSchema>;
