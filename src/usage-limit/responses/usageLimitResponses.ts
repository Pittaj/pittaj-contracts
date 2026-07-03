import type { UsageLimitPrimitives } from '../primitives';

export type UsageLimitListItem = UsageLimitPrimitives;

export type UsageLimitListResponse = {
    readonly limits: readonly UsageLimitListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};