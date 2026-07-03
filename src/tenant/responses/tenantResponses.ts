import type { TenantPrimitives, TenantSummaryPrimitives } from '../primitives';

export type TenantListItem = TenantSummaryPrimitives & {
    readonly maxUsers: number;
    readonly maxLocations: number;
    readonly currentUsers: number;
    readonly currentLocations: number;
    readonly mrr: number;
    readonly createdAt: string;
};

export type TenantListResponse = {
    readonly tenants: TenantListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

export type TenantDetailResponse = {
    readonly tenant: TenantPrimitives;
};

export type CreateTenantResponse = {
    readonly tenant: TenantPrimitives;
};

export type UpdateTenantResponse = {
    readonly tenant: TenantPrimitives;
};