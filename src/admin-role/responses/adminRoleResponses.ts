import type { AdminRolePrimitives } from '../primitives';

export type AdminRoleListItem = AdminRolePrimitives;

export type AdminRoleListResponse = {
    readonly roles: readonly AdminRoleListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};