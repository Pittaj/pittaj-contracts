/**
 * @fileoverview Respuestas de Uso y Cuotas por tenant.
 * @module Contracts/UsageLimit/Responses
 */

import type { StampQuotaSource } from '../primitives';

/** Renglón del listado de uso: consumo real + cobro estimado + cuota de timbres. */
export type TenantUsageListItem = {
    readonly tenantId: string;
    readonly tenantName: string;
    /** Código único del tenant (columna tenants.code). */
    readonly tenantCode: string;
    /** Estado de la suscripción; null si el tenant aún no tiene fila. */
    readonly subscriptionStatus: string | null;
    /** Sucursales activas. Informativo: no cuestan. */
    readonly activeLocations: number;
    readonly activeUsers: number;
    readonly activeCompanies: number;
    /** Cajas activas: lo único que mueve el cobro. */
    readonly activeDevices: number;
    /** Cajas por encima de las incluidas en la mensualidad. */
    readonly extraDevices: number;
    /** Mensualidad vigente del tenant (MXN, IVA incluido). */
    readonly basePrice: number;
    /** Precio de cada caja adicional al mes (MXN, IVA incluido). */
    readonly pricePerExtraDevice: number;
    /** basePrice + extraDevices × pricePerExtraDevice. */
    readonly estimatedMonthly: number;
    readonly currency: 'MXN';
    /** Timbres CFDI incluidos al mes (override del tenant o default de plataforma). */
    readonly includedStamps: number;
    readonly stampsQuotaSource: StampQuotaSource;
    /**
     * Timbres consumidos en el periodo. Hoy SIEMPRE null: el timbrado ocurre en
     * TPV/desktop y todavía no reporta a la nube. Se llenará cuando lo haga.
     */
    readonly stampsUsed: number | null;
    /** Motivo del override; null si aplica el default. */
    readonly quotaNotes: string | null;
};

export type TenantUsageListResponse = {
    readonly items: readonly TenantUsageListItem[];
    /** Default de plataforma vigente, para mostrarlo como referencia en la UI. */
    readonly defaultIncludedStamps: number;
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

/** Respuesta al asignar o restablecer la cuota de timbres de un tenant. */
export type TenantStampQuotaResponse = {
    readonly tenantId: string;
    readonly includedStamps: number;
    readonly stampsQuotaSource: StampQuotaSource;
    readonly quotaNotes: string | null;
};
