import type { PlanPrimitives } from '../primitives';

export type PlanListItem = {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly description: string | null;
    readonly price: number;
    readonly currency: string;
    readonly periodDays: number;
    readonly status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    readonly displayOrder: number;
    readonly createdAt: string;
};

export type PlanListResponse = {
    readonly plans: readonly PlanListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

export type PlanDetailResponse = {
    readonly plan: PlanPrimitives;
};

export type CreatePlanResponse = {
    readonly plan: PlanPrimitives;
};

export type UpdatePlanResponse = {
    readonly plan: PlanPrimitives;
};