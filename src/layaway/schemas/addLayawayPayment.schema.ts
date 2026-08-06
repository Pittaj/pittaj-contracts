/**
 * @fileoverview Zod schema para registrar un abono a un apartado.
 * @module Contracts/Layaway
 *
 * POST /api/layaways/:id/payments — registra un abono (anticipo) sobre el saldo pendiente
 * (no puede exceder el saldo) y lo asienta como CASH_IN/DEPOSIT en la sesión (INTEGRAL).
 * `version` habilita el control de concurrencia optimista (OCC): si no coincide con la
 * versión en la nube → 409.
 *
 * **El abono se guarda como entidad** desde 2026-08-06: sin fecha, método e id no era un
 * documento y no se podía contabilizar. La forma de pago es opcional para no romper a quien
 * ya llama a este endpoint; si no viene, el abono queda sin método y la contabilidad lo trata
 * como efectivo, que es lo que era antes de poder distinguirlo.
 */

import { z } from 'zod';

/** Body de POST /api/layaways/:id/payments. */
export const addLayawayPaymentSchema = z.object({
    /** Importe del abono (> 0). No puede exceder el saldo pendiente. */
    amount: z.number().positive('El abono debe ser mayor que 0'),
    /** Sesión de caja donde se asienta el abono (CASH_IN/DEPOSIT). */
    sessionId: z.string().min(1, 'La sesión de caja es obligatoria'),
    /** Versión esperada del apartado (OCC). */
    version: z.number().int().min(0),
    /** Con qué forma de pago abonó. Opcional: si no viene, se asume efectivo. */
    paymentMethodId: z.string().optional(),
    paymentMethodName: z.string().max(100).optional(),
});

export type AddLayawayPaymentBody = z.infer<typeof addLayawayPaymentSchema>;
