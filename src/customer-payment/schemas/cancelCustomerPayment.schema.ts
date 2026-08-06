/**
 * @fileoverview Zod schema para cancelar un cobro.
 * @module Contracts/CustomerPayment
 *
 * POST /api/customer-payments/:id/cancel
 *
 * Cancelar devuelve el saldo a las ventas que se habían abonado y al cliente. **No borra el
 * documento**: si ya generó póliza —o un REP timbrado— lo único correcto es que quede el
 * rastro de que se deshizo, y el motor contable lo revierte con una póliza en contra.
 */

import { z } from 'zod';

/** Body de POST /api/customer-payments/:id/cancel. */
export const cancelCustomerPaymentSchema = z.object({
    /** Por qué se cancela. Obligatorio: un cobro que se deshace sin motivo no se puede auditar. */
    reason: z.string().min(3, 'El motivo es obligatorio').max(300),
});

export type CancelCustomerPaymentBody = z.infer<typeof cancelCustomerPaymentSchema>;
