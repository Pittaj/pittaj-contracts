/**
 * @fileoverview Primitivas de Pagos (cobranza de Pittaj a sus tenants).
 * @module Contracts/Payment/Primitives
 *
 * Ledger MANUAL: el operador registra pagos que YA ocurrieron, así que no hay
 * estados de procesador (PENDING/FAILED); eso llegará con la pasarela.
 * OJO: no confundir con @pittaj/contracts/payment-method, que son las formas
 * de pago del TPV de cada tenant.
 */

/** Estados de un pago registrado. */
export const PAYMENT_STATUS = {
    /** Cobrado y aplicado a la factura. */
    COMPLETED: 'COMPLETED',
    /** Devuelto: deja de contar para cubrir la factura. */
    REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/** Medios por los que Pittaj recibe el pago. */
export const PAYMENT_METHOD = {
    TRANSFER: 'TRANSFER',
    CASH: 'CASH',
    CARD: 'CARD',
    DEPOSIT: 'DEPOSIT',
    OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHODS = Object.values(PAYMENT_METHOD) as readonly PaymentMethod[];

/** Límites de validación del pago (espejo del dominio). */
export const PAYMENT_LIMITS = {
    REFERENCE_MAX_LENGTH: 100,
} as const;

export type PaymentPrimitives = {
    readonly id: string;
    readonly invoiceId: string;
    readonly tenantId: string;
    readonly tenantName: string;
    readonly amount: number;
    readonly currency: string;
    readonly method: PaymentMethod;
    readonly status: PaymentStatus;
    /** Referencia capturada por el operador (folio de transferencia, etc.). */
    readonly reference: string | null;
    readonly paidAt: string;
    readonly refundedAt: string | null;
    readonly createdAt: string;
};
