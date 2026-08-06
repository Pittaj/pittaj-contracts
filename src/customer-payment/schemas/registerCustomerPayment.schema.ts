/**
 * @fileoverview Zod schema para registrar un cobro de venta a crédito.
 * @module Contracts/CustomerPayment
 *
 * POST /api/customer-payments
 *
 * **Las aplicaciones son obligatorias y con al menos una.** Un cobro que solo dijera "el
 * cliente pagó $500" dejaría el saldo del cliente correcto y la antigüedad de saldos
 * inservible — y sin saber a qué venta pertenece, el REP de esa venta no se puede emitir.
 * Quien capture puede pedirle a la API que reparta el importe por antigüedad (`autoApply`),
 * pero el documento SIEMPRE termina con sus aplicaciones escritas.
 */

import { z } from 'zod';

/** Una parte del cobro aplicada a una venta concreta. */
export const customerPaymentApplicationSchema = z.object({
    /** Venta a crédito que se abona. */
    ticketId: z.string().uuid('El ticket debe ser un UUID'),
    /** Cuánto de este cobro se aplica a esa venta (> 0, no puede exceder su saldo). */
    amount: z.number().positive('El importe aplicado debe ser mayor que 0'),
});

/** Body de POST /api/customer-payments. */
export const registerCustomerPaymentSchema = z.object({
    customerId: z.string().uuid('El cliente es obligatorio'),
    /** Importe total cobrado. Tiene que cuadrar con la suma de las aplicaciones. */
    amount: z.number().positive('El cobro debe ser mayor que 0'),
    /** Sucursal donde se cobró. Sin ella el cobro no se puede contabilizar. */
    locationId: z.string().max(36).optional(),
    paymentMethodId: z.string().max(36).optional(),
    paymentMethodName: z.string().max(100).optional(),
    /** Tipo de la forma de pago. `CREDIT` se rechaza: pagar una deuda con deuda no es un cobro. */
    paymentMethodType: z.string().max(20).optional(),
    sessionId: z.string().max(36).optional(),
    reference: z.string().max(100).optional(),
    notes: z.string().max(1000).optional(),
    /** Cuándo pagó el cliente (ISO 8601). Si no viene, ahora. */
    occurredAt: z.string().datetime().optional(),
    /**
     * A qué ventas se aplica.
     *
     * Si se omite, la API reparte el importe entre las ventas a crédito con saldo del
     * cliente, **de la más vieja a la más nueva** — que es como se cobra y como se calcula
     * la antigüedad. Si no alcanza a cubrirlas todas, la última queda parcial.
     */
    applications: z.array(customerPaymentApplicationSchema).min(1).optional(),
});

export type RegisterCustomerPaymentBody = z.infer<typeof registerCustomerPaymentSchema>;
export type CustomerPaymentApplicationInput = z.infer<typeof customerPaymentApplicationSchema>;
