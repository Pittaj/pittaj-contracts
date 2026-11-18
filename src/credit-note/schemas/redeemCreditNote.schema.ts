/**
 * @fileoverview Zod schema para redimir una nota de crédito.
 * @module Contracts/CreditNote
 *
 * POST /api/credit-notes/:id/redeem — aplica un importe del saldo. `version` habilita
 * el control de concurrencia optimista (OCC): si no coincide con la versión en la nube,
 * la operación falla con 409 (otro proceso redimió/modificó la nota primero).
 */

import { z } from 'zod';

/** Body de POST /api/credit-notes/:id/redeem. */
export const redeemCreditNoteSchema = z.object({
    /** Importe a aplicar del saldo (> 0). Se aplica hasta el saldo disponible. */
    amount: z.number().positive('El monto debe ser mayor que 0'),
    /** Versión esperada de la nota (OCC). */
    version: z.number().int().min(0),
    /**
     * C4 de plan-caja-sin-salir · Id del uso, generado por quien usa la nota: reintentar no lo cuenta
     * dos veces. Sin él, la nube genera uno.
     */
    redemptionId: z.string().uuid().optional(),
    /** C4 · Venta en la que se usó. */
    ticketId: z.string().max(36).optional(),
});

export type RedeemCreditNoteBody = z.infer<typeof redeemCreditNoteSchema>;
