/**
 * @fileoverview DTO de respuesta de un cobro de venta a crédito.
 * @module Contracts/CustomerPayment
 */

import type {
    CustomerPaymentApplicationPrimitives,
    CustomerPaymentStatusPrimitive,
} from '../primitives/customerPaymentPrimitives.js';

/** Cómo se aplicó una parte del cobro, con el nombre del cliente ya resuelto. */
export interface CustomerPaymentApplicationResponse
    extends CustomerPaymentApplicationPrimitives {}

/** Un cobro, como lo lee la web. */
export interface CustomerPaymentResponse {
    readonly id: string;
    readonly folio: string;
    readonly customerId: string;
    /** Nombre del cliente, resuelto para no pedir el catálogo por cada fila. */
    readonly customerName: string | null;
    readonly locationId: string | null;
    readonly amount: number;
    readonly paymentMethodId: string | null;
    readonly paymentMethodName: string | null;
    readonly paymentMethodType: string | null;
    readonly sessionId: string | null;
    readonly reference: string | null;
    readonly notes: string | null;
    readonly status: CustomerPaymentStatusPrimitive;
    readonly occurredAt: string;
    readonly operatorId: string | null;
    readonly cancelledAt: string | null;
    readonly cancelledReason: string | null;
    readonly applications: readonly CustomerPaymentApplicationResponse[];
}
