import { z } from 'zod';

export const COUPON_CONSTANTS = {
    CODE: { MIN_LENGTH: 3, MAX_LENGTH: 50, PATTERN: /^[A-Z0-9][A-Z0-9_-]*$/ },
    NAME: { MIN_LENGTH: 2, MAX_LENGTH: 150 },
    DISCOUNT: { PERCENTAGE_MAX: 100 },
} as const;

const discountTypeSchema = z.enum(['percentage', 'fixed']);

export const couponIdParamSchema = z.object({
    id: z.string().uuid(),
});

export const listCouponsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'USED_OUT']).optional(),
    search: z.string().optional(),
});

/** Campos editables de un cupón (compartidos por create/update). */
const couponMutableShape = {
    name: z.string().min(COUPON_CONSTANTS.NAME.MIN_LENGTH).max(COUPON_CONSTANTS.NAME.MAX_LENGTH),
    discountType: discountTypeSchema,
    discountValue: z.number().positive('El descuento debe ser positivo'),
    validFrom: z.string().datetime('Fecha de inicio inválida'),
    validUntil: z.string().datetime('Fecha de fin inválida'),
    maxUses: z.number().int().positive().nullable().optional(),
};

/** Reglas cruzadas: vigencia coherente y tope de porcentaje. */
interface CouponMutable {
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validFrom: string;
    validUntil: string;
}

function validityIsCoherent(d: CouponMutable): boolean {
    return new Date(d.validUntil).getTime() > new Date(d.validFrom).getTime();
}

function percentageWithinCap(d: CouponMutable): boolean {
    return d.discountType !== 'percentage' || d.discountValue <= COUPON_CONSTANTS.DISCOUNT.PERCENTAGE_MAX;
}

export const createCouponSchema = z
    .object({
        code: z
            .string()
            .regex(COUPON_CONSTANTS.CODE.PATTERN, 'Código inválido (MAYÚSCULAS, números, - y _)')
            .min(COUPON_CONSTANTS.CODE.MIN_LENGTH)
            .max(COUPON_CONSTANTS.CODE.MAX_LENGTH),
        ...couponMutableShape,
    })
    .refine(validityIsCoherent, {
        message: 'La fecha de fin debe ser posterior a la de inicio',
        path: ['validUntil'],
    })
    .refine(percentageWithinCap, {
        message: 'El porcentaje no puede superar 100',
        path: ['discountValue'],
    });

export const updateCouponSchema = z
    .object(couponMutableShape)
    .refine(validityIsCoherent, {
        message: 'La fecha de fin debe ser posterior a la de inicio',
        path: ['validUntil'],
    })
    .refine(percentageWithinCap, {
        message: 'El porcentaje no puede superar 100',
        path: ['discountValue'],
    });

export const toggleCouponSchema = z.object({
    active: z.boolean(),
});

export type ListCouponsInput = z.infer<typeof listCouponsSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ToggleCouponInput = z.infer<typeof toggleCouponSchema>;
