/**
 * @fileoverview Respuestas de Pagos.
 * @module Contracts/Payment/Responses
 */

import type { PaymentPrimitives } from '../primitives';

/** Renglón del listado de pagos (incluye el folio de su factura). */
export type PaymentListItem = PaymentPrimitives & {
    readonly invoiceNumber: string;
};

export type PaymentListResponse = {
    readonly payments: readonly PaymentListItem[];
    /** Suma de los pagos COMPLETED del filtro actual (sin paginar). */
    readonly collectedAmount: number;
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};
