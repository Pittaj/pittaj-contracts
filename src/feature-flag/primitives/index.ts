export type FeatureFlagPrimitives = {
    readonly id: string;
    readonly key: string;
    readonly name: string;
    readonly description: string | null;
    readonly enabled: boolean;
    readonly isPublic: boolean;
    readonly tenantId: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
};