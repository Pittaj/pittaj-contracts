/**
 * @fileoverview Respuestas de Facturas.
 * @module Contracts/Invoice/Responses
 */

import type { InvoicePrimitives } from '../primitives';
import type { PaymentPrimitives } from '../../payment/primitives';

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

/** Resultado de generar las facturas de un periodo. */
export type GenerateInvoicesResponse = {
    readonly period: string;
    /** Facturas creadas en esta corrida. */
    readonly created: number;
    /** Tenants que ya tenían factura del periodo (la generación es idempotente). */
    readonly skipped: number;
};
