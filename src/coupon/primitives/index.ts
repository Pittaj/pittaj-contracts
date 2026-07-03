export type CouponStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'USED_OUT';

export type CouponPrimitives = {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly discountType: 'percentage' | 'fixed';
    readonly discountValue: number;
    readonly status: CouponStatus;
    readonly validFrom: string;
    readonly validUntil: string;
    readonly maxUses: number | null;
    readonly usedCount: number;
    readonly createdAt: string;
};