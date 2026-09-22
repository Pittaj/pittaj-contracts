/**
 * @fileoverview Respuestas de Uso y Cuotas por tenant.
 * @module Contracts/UsageLimit/Responses
 */

import type { StampQuotaSource, OperationKind } from '../primitives/index.js';

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

/** Operaciones de un tenant en un mes (mes calendario, hora de Ciudad de México). */
export type OperationUsageResponse = {
    /** `YYYY-MM`. */
    readonly period: string;
    /** Inicio del mes, ISO en UTC (inclusivo). */
    readonly periodStart: string;
    /** Inicio del mes siguiente, ISO en UTC (exclusivo). */
    readonly periodEnd: string;
    readonly total: number;
    /** Solo los tipos con al menos una operación. */
    readonly byKind: Readonly<Partial<Record<OperationKind, number>>>;
};

/** Una operación contada: lo que el cliente ve para auditar su cobro. */
export type OperationListItem = {
    readonly id: string;
    readonly kind: OperationKind;
    readonly documentId: string;
    /** Folio legible del documento; null si no tiene. */
    readonly reference: string | null;
    /** Cuándo llegó a la nube (ISO). Lo del escritorio cuenta en el mes en que sube. */
    readonly countedAt: string;
};

export type OperationListResponse = {
    readonly period: string;
    readonly items: readonly OperationListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};
