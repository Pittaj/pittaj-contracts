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
    /** Sucursales activas del tenant: base del cobro. */
    readonly activeLocations: number;
    /** Precio por sucursal/mes (MXN, IVA incluido). */
    readonly pricePerLocation: number;
    /** MRR estimado = activeLocations × pricePerLocation (solo si ACTIVE). */
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
    readonly activeLocations: number;
    readonly mrr: number;
};
