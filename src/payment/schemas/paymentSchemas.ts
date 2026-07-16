/**
 * @fileoverview Esquemas de entrada de Pagos.
 * @module Contracts/Payment/Schemas
 */

import { z } from 'zod';
import { PAYMENT_LIMITS } from '../primitives';

/** Filtros del listado de pagos. */
export const listPaymentsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['COMPLETED', 'REFUNDED']).optional(),
    method: z.enum(['TRANSFER', 'CASH', 'CARD', 'DEPOSIT', 'OTHER']).optional(),
    tenantId: z.string().uuid().optional(),
    invoiceId: z.string().uuid().optional(),
    /** Acota por fecha de pago (ISO). */
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    /** Busca por referencia, folio de factura o nombre del tenant. */
    search: z.string().trim().max(120).optional(),
    sortBy: z.enum(['amount', 'paidAt', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListPaymentsInput = z.infer<typeof listPaymentsSchema>;

/** Parámetro :id de pago. */
export const paymentIdParamSchema = z.object({
    id: z.string().uuid('El ID del pago debe ser un UUID válido'),
});

export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;

/** Registro manual de un pago contra una factura. */
export const recordPaymentSchema = z.object({
    amount: z
        .number()
        .positive('El monto del pago debe ser mayor a cero')
        .max(9_999_999, 'El monto del pago es demasiado grande'),
    method: z.enum(['TRANSFER', 'CASH', 'CARD', 'DEPOSIT', 'OTHER']),
    /** Folio de transferencia, autorización, etc. */
    reference: z.string().trim().max(PAYMENT_LIMITS.REFERENCE_MAX_LENGTH).optional(),
    /** Fecha real del pago (ISO). Default: ahora. */
    paidAt: z.string().datetime({ offset: true }).optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
