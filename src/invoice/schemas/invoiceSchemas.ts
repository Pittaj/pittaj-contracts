/**
 * @fileoverview Esquemas de entrada de Facturas.
 * @module Contracts/Invoice/Schemas
 */

import { z } from 'zod';
import { INVOICE_LIMITS } from '../primitives';

/** Filtros del listado de facturas. */
export const listInvoicesSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    /** OVERDUE es derivado; el backend lo traduce a SQL (PENDING + vencida). */
    status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
    tenantId: z.string().uuid().optional(),
    /** Acota por fecha de emisión (ISO). */
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    /** Busca por folio o nombre del tenant. */
    search: z.string().trim().max(120).optional(),
    sortBy: z.enum(['invoiceNumber', 'amount', 'dueDate', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListInvoicesInput = z.infer<typeof listInvoicesSchema>;

/** Parámetro :id de factura. */
export const invoiceIdParamSchema = z.object({
    id: z.string().uuid('El ID de la factura debe ser un UUID válido'),
});

export type InvoiceIdParam = z.infer<typeof invoiceIdParamSchema>;

/** Generación de las facturas de un periodo mensual (YYYY-MM). */
export const generateInvoicesSchema = z.object({
    period: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'El periodo debe tener formato YYYY-MM'),
});

export type GenerateInvoicesInput = z.infer<typeof generateInvoicesSchema>;

/** Cancelación de una factura. */
export const cancelInvoiceSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(1, 'El motivo de cancelación es obligatorio')
        .max(INVOICE_LIMITS.CANCELLATION_REASON_MAX_LENGTH),
});

export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
