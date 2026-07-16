/**
 * @fileoverview Primitivas de Uso y Cuotas por tenant.
 * @module Contracts/UsageLimit/Primitives
 *
 * Modelo de negocio vigente (decisión 2026-07-04): precio único por sucursal,
 * sin planes por niveles. Por eso NO hay topes de usuarios/productos: las
 * sucursales se cobran, no se limitan. Lo único acotado son los timbres CFDI
 * incluidos al mes, con un default de plataforma y override por tenant.
 */

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
