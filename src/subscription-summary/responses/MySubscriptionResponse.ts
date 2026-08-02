/**
 * @fileoverview DTO de "Mi Suscripción" para el tenant autenticado.
 *
 * Modelo de negocio: precio único con COBRO POR CAJA — sin planes por niveles
 * y sin cobro por sucursal. La mensualidad (setting billing.base-price, $399
 * MXN IVA incluido) cubre 3 cajas en TODA la cuenta, y de ahí en adelante se
 * cobra por caja. Abrir sucursales no cuesta.
 *
 * Incluye 100 timbres CFDI/mes POR CUENTA (no por sucursal), extras por paquete.
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
    'SUSPENDED',
] as const;
export type MySubscriptionStatus = (typeof MY_SUBSCRIPTION_STATUSES)[number];

/** Conteos de uso del tenant (informativos; sin límites que bloqueen). */
export interface SubscriptionUsage {
    readonly users: number;
    readonly companies: number;
    /** Sucursales activas. Informativo: no cuestan. */
    readonly locations: number;
    /** Cajas activas hoy en toda la cuenta: lo único que se cobra. */
    readonly devices: number;
}

/** Datos de cobro estimado (preliminar hasta integrar pagos). */
export interface SubscriptionBilling {
    /** Sucursales activas. Se conserva por compatibilidad; ya no cobra nada. */
    readonly activeLocations: number;
    /** Mensualidad, IVA incluido (setting billing.base-price). */
    readonly basePrice: number;
    /** Cajas cubiertas por la mensualidad. */
    readonly includedDevices: number;
    /** Cajas activas por encima de las incluidas. */
    readonly extraDevices: number;
    /** Precio de cada caja adicional al mes, IVA incluido. */
    readonly pricePerExtraDevice: number;
    readonly currency: 'MXN';
    /** basePrice + extraDevices × pricePerExtraDevice, menos el cupón vigente. */
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
