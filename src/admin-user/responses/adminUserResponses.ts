import type { AdminUserPrimitives, AdminUserSummaryPrimitives } from '../primitives';

export type AdminUserListItem = AdminUserSummaryPrimitives & {
    readonly lastLoginAt: string | null;
    readonly createdAt: string;
};

export type AdminUserListResponse = {
    readonly adminUsers: AdminUserListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

export type AdminUserDetailResponse = {
    readonly adminUser: AdminUserPrimitives;
};

export type CreateAdminUserResponse = {
    readonly adminUser: AdminUserPrimitives;
};

// ── Auth del backoffice ──

export type AdminSaltResponse = {
    readonly salt: string;
};

export type AdminLoginResponse = {
    readonly accessToken: string;
    readonly expiresIn: number;
    readonly adminUser: {
        readonly id: string;
        readonly email: string;
        readonly firstName: string;
        readonly lastName: string;
        readonly roleName: string;
    };
};