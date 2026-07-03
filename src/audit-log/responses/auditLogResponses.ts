import type { AuditLogPrimitives } from '../primitives';

export type AuditLogListItem = AuditLogPrimitives;

export type AuditLogListResponse = {
    readonly logs: readonly AuditLogListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};