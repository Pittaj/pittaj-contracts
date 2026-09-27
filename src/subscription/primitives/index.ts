/**
 * Las suscripciones de todos los tenants, para el backoffice (modelo por operaciones). El MRR es el
 * precio del plan de las cuentas activas; el excedente del mes vive en Uso por tenant.
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
    /** Plan contratado; null si la cuenta no tiene. */
    readonly planName: string | null;
    /** Mensualidad del tenant (MXN, IVA incluido): el plan, o su precio especial. */
    readonly basePrice: number;
    /** MRR = la mensualidad, solo si ACTIVE. */
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
    readonly planName: string | null;
    /** Mensualidad del tenant (MXN, IVA incluido). */
    readonly basePrice: number;
    /** MRR = la mensualidad, solo si ACTIVE. */
    readonly mrr: number;
};
