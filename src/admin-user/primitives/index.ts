export type AdminUserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export type AdminUserPrimitives = {
    readonly id: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly roleId: string;
    readonly roleName: string;
    readonly status: AdminUserStatus;
    readonly lastLoginAt: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
};

export type AdminUserSummaryPrimitives = {
    readonly id: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly roleName: string;
    readonly status: AdminUserStatus;
};