/**
 * @fileoverview C4 de plan-caja-sin-salir · Los usos de una nota de crédito.
 * @module Contracts/CreditNote
 *
 * El saldo de la nota se deriva de sus usos (§4 del mandato de paridad): `amount − Σ usos`. El uso viaja
 * por el sync como `credit-note-redemption` en los dos sentidos; el saldo que traiga la nota no manda.
 */

import { z } from 'zod';

export const creditNoteRedemptionSyncSchema = z.object({
    id: z.string().uuid(),
    creditNoteId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    ticketId: z.string().max(36).nullable().optional(),
    occurredAt: z.coerce.date(),
});
export type CreditNoteRedemptionSync = z.infer<typeof creditNoteRedemptionSyncSchema>;

/** Lo que baja: el uso con sus marcas. */
export interface CreditNoteRedemptionResponse {
    readonly id: string;
    readonly creditNoteId: string;
    readonly amount: number;
    readonly ticketId: string | null;
    /** ISO 8601. */
    readonly occurredAt: string;
    readonly version: number;
    readonly createdAt: string;
    readonly updatedAt: string;
}

/** El saldo de una nota a partir de sus usos. Nunca negativo. */
export function saldoDeLaNota(importe: number, usos: readonly { readonly amount: number }[]): number {
    const usado = usos.reduce((s, u) => s + u.amount, 0);
    return Math.max(0, Math.round((importe - usado) * 100) / 100);
}

/**
 * (2.114.0) Lo que los usos de una nota pasan de su importe. Una misma nota usada en dos cajas a la vez, con una
 * sin conexión, suma usos de más: los dos suben bien por el sync, y aquí se ve. 0 = no está sobregirada.
 */
export function sobregiroDeLaNota(importe: number, usos: readonly { readonly amount: number }[]): number {
    const usado = usos.reduce((s, u) => s + u.amount, 0);
    return Math.max(0, Math.round((usado - importe) * 100) / 100);
}
