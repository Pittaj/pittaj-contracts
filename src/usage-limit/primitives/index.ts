/**
 * @fileoverview Primitivas de Uso y Cuotas por tenant.
 * @module Contracts/UsageLimit/Primitives
 *
 * Modelo de negocio vigente (2026-09-22, docs `producto/modelo-negocio.md`): se cobra por
 * OPERACIONES al mes, con timbres CFDI incluidos por plan. No hay topes de usuarios, cajas ni
 * sucursales. Lo que sigue de timbres (default de plataforma y override por tenant) es lo que
 * existe hoy; el plan lo reemplaza por los timbres de cada plan.
 */

/**
 * Tipos de operación que cuentan para el cobro (docs `producto/modelo-negocio.md` §2).
 * Una operación es un documento que el usuario confirma y que mueve dinero o inventario.
 */
export const OPERATION_KIND = {
    SALE: 'SALE',
    SALE_ORDER: 'SALE_ORDER',
    SALE_RETURN: 'SALE_RETURN',
    CREDIT_NOTE: 'CREDIT_NOTE',
    CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
    LAYAWAY_PAYMENT: 'LAYAWAY_PAYMENT',
    PURCHASE: 'PURCHASE',
    SUPPLIER_NOTE: 'SUPPLIER_NOTE',
    SUPPLIER_PAYMENT: 'SUPPLIER_PAYMENT',
    TRANSFER: 'TRANSFER',
    ADJUSTMENT: 'ADJUSTMENT',
    PRODUCTION: 'PRODUCTION',
    BANK_MOVEMENT: 'BANK_MOVEMENT',
    MANUAL_JOURNAL: 'MANUAL_JOURNAL',
} as const;

export type OperationKind = (typeof OPERATION_KIND)[keyof typeof OPERATION_KIND];

export const OPERATION_KINDS = Object.values(OPERATION_KIND) as readonly OperationKind[];

/** Periodo de consumo: mes calendario en hora de Ciudad de México, `YYYY-MM`. */
export const OPERATION_PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Origen de la cuota de timbres vigente para un tenant. */
export const STAMP_QUOTA_SOURCE = {
    /** Sin override: aplica el default de plataforma. */
    DEFAULT: 'DEFAULT',
    /** El tenant tiene una cuota propia asignada desde el backoffice. */
    OVERRIDE: 'OVERRIDE',
} as const;

export type StampQuotaSource = (typeof STAMP_QUOTA_SOURCE)[keyof typeof STAMP_QUOTA_SOURCE];

/** Límites de validación de la cuota de timbres (espejo del dominio). */
export const STAMP_QUOTA_LIMITS = {
    MIN: 0,
    MAX: 1_000_000,
    NOTES_MAX_LENGTH: 300,
} as const;

/** Override de cuota de timbres de un tenant (fila de tenant_usage_quotas). */
export type TenantStampQuotaPrimitives = {
    readonly id: string;
    readonly tenantId: string;
    readonly includedStamps: number;
    readonly notes: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
};
