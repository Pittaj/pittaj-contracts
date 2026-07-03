export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export type PlanPrimitives = {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly description: string | null;
    readonly price: number;
    readonly currency: string;
    readonly periodDays: number;
    readonly status: PlanStatus;
    readonly features: readonly string[];
    readonly limits: {
        readonly maxUsers: number;
        readonly maxLocations: number;
        readonly maxProducts: number;
        readonly hasAnalytics: boolean;
        readonly hasApiAccess: boolean;
    };
    readonly displayOrder: number;
    readonly createdAt: string;
    readonly updatedAt: string;
};

export type PlanSummaryPrimitives = {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly price: number;
    readonly status: PlanStatus;
};