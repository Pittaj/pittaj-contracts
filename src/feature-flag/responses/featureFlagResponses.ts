import type { FeatureFlagPrimitives } from '../primitives';

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