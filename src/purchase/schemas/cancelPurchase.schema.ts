/**
 * @fileoverview Zod schema para cancelar una compra.
 *
 * El **motivo es obligatorio y no puede ir en blanco**: es la invariante
 * `PURCHASE_NEED_REASON` del escritorio, y la razón práctica está en el diseño —
 * el motivo es lo que se lee dentro de seis meses, cuando ya nadie se acuerda.
 *
 * (El diálogo del escritorio rellenaba «Sin motivo» cuando el campo quedaba vacío,
 * o sea que la invariante existía y la UI la esquivaba. Corregido junto con esto.)
 *
 * @module Contracts/Purchase
 */

import { z } from 'zod';

/** POST /api/purchases/:id/cancel */
export const cancelPurchaseSchema = z
    .object({
        /** Versión que el cliente tiene en pantalla (OCC). */
        version: z.number().int().min(1, { message: 'La versión debe ser 1 o mayor' }),
        /** Motivo de la cancelación. Obligatorio y no vacío. */
        reason: z
            .string()
            .trim()
            .min(1, { message: 'Indica el motivo de cancelación' })
            .max(500, { message: 'El motivo no puede exceder 500 caracteres' }),
    })
    .strict();

export type CancelPurchaseRequest = z.infer<typeof cancelPurchaseSchema>;
