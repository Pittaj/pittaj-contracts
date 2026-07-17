/**
 * @fileoverview Respuestas de las Analíticas de Uso.
 * @module Contracts/SaasMetrics/Responses
 *
 * Miden USO DEL PRODUCTO (¿lo están usando?), no ingresos (eso es
 * SaasMetricsResponse). Todo sale de actividad real registrada.
 */

/** Módulos cuyo uso se mide, por la actividad que dejan en la base. */
export const USAGE_MODULE = {
    /** Tickets del punto de venta. */
    POS: 'pos',
    /** Sesiones/turnos de caja. */
    CASH: 'cash',
    /** Compras a proveedores. */
    PURCHASING: 'purchasing',
    /** Movimientos de inventario. */
    INVENTORY: 'inventory',
    /** Pedidos de venta. */
    SALES: 'sales',
} as const;

export type UsageModule = (typeof USAGE_MODULE)[keyof typeof USAGE_MODULE];

/** Cuánto se usa un módulo en el periodo. */
export type ModuleAdoption = {
    readonly module: UsageModule;
    /** Nombre del módulo para el operador. */
    readonly label: string;
    /** Tenants distintos que lo usaron al menos una vez. */
    readonly tenantsUsing: number;
    /** Registros que dejaron (volumen de uso). */
    readonly events: number;
};

/** Tenant con más actividad en el periodo. */
export type TenantActivity = {
    readonly tenantId: string;
    readonly tenantName: string;
    /** Tickets emitidos en el periodo. */
    readonly tickets: number;
};

/** Tenant sin actividad en el periodo: señal temprana de baja. */
export type InactiveTenant = {
    readonly tenantId: string;
    readonly tenantName: string;
    /** Último ticket registrado; null si nunca vendió. */
    readonly lastActivityAt: string | null;
};

export type UsageAnalyticsResponse = {
    readonly period: string;
    readonly summary: {
        /** Tenants CUSTOMER con suscripción viva (activa o en prueba). */
        readonly totalTenants: number;
        /** De esos, los que registraron actividad en el periodo. */
        readonly activeTenants: number;
        /** activeTenants / totalTenants (0-1). */
        readonly adoptionRate: number;
        readonly ticketsIssued: number;
        readonly cashSessions: number;
        /** Usuarios distintos que entraron en el periodo. */
        readonly activeUsers: number;
    };
    readonly moduleAdoption: readonly ModuleAdoption[];
    readonly topTenants: readonly TenantActivity[];
    readonly inactiveTenants: readonly InactiveTenant[];
};
