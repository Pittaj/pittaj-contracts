import type { FeatureFlagPrimitives } from '../primitives/index.js';

export type FeatureFlagListItem = FeatureFlagPrimitives;

export type FeatureFlagListResponse = {
    readonly flags: readonly FeatureFlagListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

export type FeatureFlagDetailResponse = {
    readonly flag: FeatureFlagPrimitives;
};

export type CreateFeatureFlagResponse = FeatureFlagDetailResponse;
export type UpdateFeatureFlagResponse = FeatureFlagDetailResponse;