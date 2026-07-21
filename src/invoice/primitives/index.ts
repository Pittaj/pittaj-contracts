/**
 * @fileoverview Primitivas de Facturas (cobranza de Pittaj a sus tenants).
 * @module Contracts/Invoice/Primitives
 *
 * Ledger de cobranza MANUAL: no hay procesador de pagos ni timbrado CFDI.
 * El importe sale del modelo de negocio vigente: sucursales activas × precio
 * por sucursal ($399/mes, IVA incluido; decisión 2026-07-04).
 */

/**
 * Estados de una factura.
 *
 * DRAFT y PENDING/PAID/CANCELLED se PERSISTEN. OVERDUE es DERIVADO
 * (PENDING con dueDate vencida), nunca se guarda: el mismo criterio que el
 * status de los cupones.
 */
export const INVOICE_STATUS = {
    /** Generada pero no emitida: aún se puede regenerar/ajustar. */
    DRAFT: 'DRAFT',
    /** Emitida y esperando pago. */
    PENDING: 'PENDING',
    /** Cubierta por completo. */
    PAID: 'PAID',
    /** Derivado: PENDING con fecha de vencimiento pasada. */
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

/** Estados que existen en la base (OVERDUE queda fuera: se deriva). */
export const INVOICE_STORED_STATUSES = ['DRAFT', 'PENDING', 'PAID', 'CANCELLED'] as const;

export type InvoiceStoredStatus = (typeof INVOICE_STORED_STATUSES)[number];

/** Límites de validación de la factura (espejo del dominio). */
export const INVOICE_LIMITS = {
    NOTES_MAX_LENGTH: 300,
    CANCELLATION_REASON_MAX_LENGTH: 300,
} as const;

export type InvoicePrimitives = {
    readonly id: string;
    readonly tenantId: string;
    readonly tenantName: string;
    /** Suscripción que originó la factura. */
    readonly subscriptionId: string;
    /** Folio (FAC-2026-N). */
    readonly invoiceNumber: string;
    readonly status: InvoiceStatus;
    /** Inicio del periodo facturado (ISO, primer día del mes). */
    readonly periodStart: string;
    /** Fin del periodo facturado (ISO, último día del mes). */
    readonly periodEnd: string;
    /** Sucursales activas al generar: base del cálculo. */
    readonly activeLocations: number;
    readonly pricePerLocation: number;
    /** Cargo base del mes: activeLocations × pricePerLocation. */
    readonly baseAmount: number;
    /** Prorrateo de altas de sucursal del periodo anterior (0 si no hay). */
    readonly prorationAmount: number;
    /** Descuento por cupón aplicado (0 si no hay). */
    readonly discountAmount: number;
    /** Código del cupón aplicado (snapshot), null si no hay. */
    readonly couponCode: string | null;
    /** Importe a cobrar: (base + prorrateo) − descuento. */
    readonly amount: number;
    /** Suma de los pagos no reembolsados. */
    readonly paidAmount: number;
    readonly currency: string;
    /** Null mientras sea DRAFT: se fija al emitir. */
    readonly dueDate: string | null;
    /** Null mientras sea DRAFT. */
    readonly issuedAt: string | null;
    readonly paidAt: string | null;
    readonly cancelledAt: string | null;
    readonly cancellationReason: string | null;
    readonly notes: string | null;
    readonly createdAt: string;
};
