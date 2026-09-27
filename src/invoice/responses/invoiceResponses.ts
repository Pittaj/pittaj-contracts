/**
 * @fileoverview Respuestas de Facturas.
 * @module Contracts/Invoice/Responses
 */

import type { InvoicePrimitives } from '../primitives/index.js';
import type { PaymentPrimitives } from '../../payment/primitives/index.js';

/** Renglón del listado de facturas. */
export type InvoiceListItem = Omit<InvoicePrimitives, 'notes' | 'cancellationReason'>;

export type InvoiceListResponse = {
    readonly invoices: readonly InvoiceListItem[];
    /** Suma de lo pendiente de cobro en el filtro actual (sin paginar). */
    readonly outstandingAmount: number;
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

/** Detalle de una factura con sus pagos. */
export type InvoiceDetailResponse = InvoicePrimitives & {
    readonly payments: readonly PaymentPrimitives[];
};

/**
 * Un cobro de la cuenta autenticada, como lo ve «Mi suscripción → Cobros anteriores»
 * (`GET /api/billing/invoices`). Desglosado igual que la factura, para contestar «¿por qué me
 * cobraron $269?» sin escribir a soporte.
 */
export type MyInvoiceItem = {
    readonly id: string;
    readonly invoiceNumber: string;
    /** Inicio del mes que paga (ISO). */
    readonly periodStart: string;
    /** PENDING con vencimiento pasado se devuelve como OVERDUE. Nunca DRAFT. */
    readonly status: 'PENDING' | 'OVERDUE' | 'PAID' | 'CANCELLED';
    readonly amount: number;
    readonly basePrice: number;
    /** Operaciones de más del mes anterior y su importe (con el tope ya aplicado). */
    readonly overageOperations: number;
    readonly overageAmount: number;
    readonly extraStamps: number;
    readonly extraStampsAmount: number;
    /** Prorrateos de subidas y otros cargos anotados. */
    readonly prorationAmount: number;
    readonly discountAmount: number;
    readonly dueDate: string | null;
    readonly paidAt: string | null;
    /** El CFDI de la factura; NONE si todavía no se timbra. */
    readonly cfdi: {
        readonly status: 'NONE' | 'PENDING' | 'STAMPED' | 'FAILED' | 'CANCELLED';
        readonly uuid: string | null;
    };
};

export type MyInvoiceListResponse = {
    /** Los últimos 24, del más nuevo al más viejo. */
    readonly items: readonly MyInvoiceItem[];
};
