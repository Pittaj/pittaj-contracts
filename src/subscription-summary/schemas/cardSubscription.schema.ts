/**
 * @fileoverview Alta de la tarjeta del cobro por operaciones (Mercado Pago).
 * @module Contracts/SubscriptionSummary/Schemas
 *
 * La web tokeniza la tarjeta con el SDK de Mercado Pago —el número nunca llega a Pittaj— y manda el
 * token de un solo uso con los datos para mostrarla. `POST /api/billing/card-subscription`.
 */
import { z } from 'zod';

export const startCardSubscriptionSchema = z.object({
    /** Token de un solo uso que devuelve el SDK de Mercado Pago. */
    cardTokenId: z.string().trim().min(1).max(100),
    card: z.object({
        /** `visa`, `master`, `amex`… (el `payment_method_id` de Mercado Pago). */
        brand: z.string().trim().min(1).max(30),
        last4: z.string().regex(/^\d{4}$/, 'Deben ser los últimos 4 dígitos'),
        expMonth: z.number().int().min(1).max(12),
        expYear: z.number().int().min(2000).max(2100),
    }),
    /** Correo del pagador; si falta, el de quien la da de alta. */
    payerEmail: z.string().trim().email().max(255).optional(),
});

export type StartCardSubscriptionInput = z.infer<typeof startCardSubscriptionSchema>;
