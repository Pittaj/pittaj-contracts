/**
 * @fileoverview Zod schema para crear un apartado.
 * @module Contracts/Layaway
 *
 * POST /api/layaways — crea el documento (líneas + total), registra el anticipo inicial como
 * CASH_IN/DEPOSIT sobre la sesión de caja (INTEGRAL: si el depósito falla, el apartado no se
 * crea, porque registra dinero del cliente) y deja el saldo pendiente.
 *
 * Espejo del CreateLayawayCommand desktop (Pittaj.Application/Layaways/Commands): la línea lleva
 * productId/productName/quantity/unitPrice (igual que LayawayLineInput). sessionId es OBLIGATORIO
 * (el anticipo necesita una caja abierta, aun si initialDeposit = 0 el flujo lo referencia).
 */

import { z } from 'zod';

/** Renglón del apartado en el body del comando. */
export const createLayawayLineSchema = z.object({
    productId: z.string().min(1, 'El producto es obligatorio'),
    productName: z.string().min(1, 'El nombre del producto es obligatorio'),
    quantity: z.number().positive('La cantidad debe ser mayor que 0'),
    unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
});

/** Body de POST /api/layaways. */
export const createLayawaySchema = z.object({
    /** Cliente del apartado (opcional; soft ref). */
    customerId: z.string().optional(),
    /** Sesión de caja para el anticipo (CASH_IN/DEPOSIT). */
    sessionId: z.string().min(1, 'La sesión de caja es obligatoria'),
    /** Moneda (default MXN). */
    currency: z.string().min(3).max(5).optional().default('MXN'),
    /** Vencimiento del apartado (ISO 8601, opcional). */
    dueDate: z.string().datetime({ offset: true }).optional(),
    /** Anticipo inicial (0 = sin anticipo). No puede exceder el total. */
    initialDeposit: z.number().min(0).optional().default(0),
    /** Renglones apartados (al menos uno). */
    lines: z.array(createLayawayLineSchema).min(1, 'El apartado no tiene líneas'),
});

export type CreateLayawayLine = z.infer<typeof createLayawayLineSchema>;
export type CreateLayawayBody = z.infer<typeof createLayawaySchema>;
