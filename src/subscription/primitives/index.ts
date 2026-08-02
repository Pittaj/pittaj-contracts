/**
 * Modelo de negocio (2026-07): PRECIO ÚNICO POR SUCURSAL — sin planes por niveles.
 * La suscripción lleva estado del ciclo de vida + facturación estimada
 * (sucursales activas × precio por sucursal). Ya no hay planId/planName.
 */

export type SubscriptionStatus =
    | 'TRIAL'
    | 'ACTIVE'
    | 'PAST_DUE'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'SUSPENDED';

export type SubscriptionPrimitives = {
    readonly id: string;
    readonly tenantId: string;
    readonly tenantName: string;
    readonly status: SubscriptionStatus;
    readonly trialEndsAt: string | null;
    readonly currentPeriodStart: string | null;
    readonly currentPeriodEnd: string | null;
    /** Sucursales activas del tenant. Informativo: no cuestan. */
    readonly activeLocations: number;
    /** Cajas activas: la base del cobro. */
    readonly activeDevices: number;
    /** Mensualidad del tenant (MXN, IVA incluido). */
    readonly basePrice: number;
    /** MRR estimado = mensualidad + cajas extra × precio (solo si ACTIVE). */
    readonly mrr: number;
    readonly currency: string;
    readonly createdAt: string;
    readonly updatedAt: string | null;
};

export type SubscriptionSummaryPrimitives = {
    readonly id: string;
    readonly tenantId: string;
    readonly tenantName: string;
    readonly status: SubscriptionStatus;
    /** Sucursales activas. Informativo: no cuestan. */
    readonly activeLocations: number;
    /** Cajas activas: la base del MRR. */
    readonly activeDevices: number;
    /** Mensualidad del tenant (MXN, IVA incluido). */
    readonly basePrice: number;
    /** MRR = mensualidad + cajas extra × precio (solo si ACTIVE). */
    readonly mrr: number;
};
