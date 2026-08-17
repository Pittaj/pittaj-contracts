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
    /**
     * Versión del registro para el control de concurrencia.
     *
     * **Obligatorio, no opcional**: este DTO también viaja en el pull de
     * sincronización, y el escritorio lo lee con `GetProperty("version")`, que
     * lanza `KeyNotFoundException` si falta. El síntoma es «The given key was not
     * present in the dictionary» y el efecto es que el catálogo entero deja de
     * bajar — sin mencionar ni el campo ni la entidad.
     */
    readonly version: number;
}
