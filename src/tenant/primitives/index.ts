export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export type TenantPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export type TenantType = 'PLATFORM' | 'CUSTOMER';

export type TenantPrimitives = {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly type: TenantType;
    readonly status: TenantStatus;
    readonly plan: TenantPlan;
    readonly maxUsers: number;
    readonly maxLocations: number;
    readonly currentUsers: number;
    readonly currentLocations: number;
    readonly mrr: number;
    readonly tenantDomain: string | null;
    readonly metadata: Record<string, unknown> | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly activatedAt: string | null;
    readonly suspendedAt: string | null;
};

export type TenantSummaryPrimitives = {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly type: TenantType;
    readonly status: TenantStatus;
    readonly plan: TenantPlan;
};