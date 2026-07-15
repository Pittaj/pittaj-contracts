import type { CouponPrimitives } from '../primitives';

export type CouponListItem = CouponPrimitives;

export type CouponListResponse = {
    readonly coupons: readonly CouponListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

export type CouponDetailResponse = {
    readonly coupon: CouponPrimitives;
};

export type CreateCouponResponse = CouponDetailResponse;
export type UpdateCouponResponse = CouponDetailResponse;
