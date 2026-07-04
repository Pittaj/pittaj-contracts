/**
 * @fileoverview DTO de "Mi Suscripción" para el tenant autenticado.
 *
 * Modelo de negocio (decisión 2026-07-03): precio único con COBRO POR
 * SUCURSAL — sin planes por niveles. El estimado mensual es
 * sucursales activas × precio por sucursal (setting billing.price-per-location,
 * preliminar hasta que exista integración de pagos).
 *
 * @module Contracts/SubscriptionSummary
 */

/** Estados de la suscripción (espejo del dominio backend). */
export const MY_SUBSCRIPTION_STATUSES = [
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
] as const;
export type MySubscriptionStatus = (typeof MY_SUBSCRIPTION_STATUSES)[number];

/** Conteos de uso del tenant (informativos; sin límites que bloqueen). */
export interface SubscriptionUsage {
    readonly users: number;
    readonly companies: number;
    readonly locations: number;
}

/** Datos de cobro estimado (preliminar hasta integrar pagos). */
export interface SubscriptionBilling {
    /** Sucursales activas: la base del cobro. */
    readonly activeLocations: number;
    /** Precio por sucursal/mes (setting billing.price-per-location). */
    readonly pricePerLocation: number;
    readonly currency: 'MXN';
    /** activeLocations × pricePerLocation. */
    readonly estimatedMonthly: number;
    /** true mientras no exista integración de pagos (precio preliminar). */
    readonly preliminary: boolean;
}

/** Respuesta de GET /api/subscriptions/me. */
export interface MySubscriptionResponse {
    readonly status: MySubscriptionStatus;
    /** Fin de la prueba (ISO 8601); null si no aplica. */
    readonly trialEndsAt: string | null;
    /** Días restantes de prueba (0 si venció hoy); null si no está en TRIAL. */
    readonly trialDaysLeft: number | null;
    readonly currentPeriodStart: string | null;
    readonly currentPeriodEnd: string | null;
    readonly usage: SubscriptionUsage;
    readonly billing: SubscriptionBilling;
}
