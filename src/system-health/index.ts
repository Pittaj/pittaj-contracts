/**
 * @fileoverview Contract de Salud del Sistema (Monitoreo del backoffice).
 * @module Contracts/SystemHealth
 *
 * Sondas de INFRAESTRUCTURA, no de negocio (eso es saas-metrics): responde a
 * "¿está bien el sistema ahora mismo?" con datos medidos en el momento.
 */

/** Estado de un chequeo. El global es el PEOR de todos. */
export const SYSTEM_HEALTH_STATUS = {
    /** Todo normal. */
    OK: 'OK',
    /** Funciona, pero hay algo que mirar. */
    WARN: 'WARN',
    /** No responde o falló la sonda. */
    DOWN: 'DOWN',
} as const;

export type SystemHealthStatus = (typeof SYSTEM_HEALTH_STATUS)[keyof typeof SYSTEM_HEALTH_STATUS];

/** Chequeos que se ejecutan (clave estable para la UI). */
export const SYSTEM_CHECK_KEY = {
    DATABASE: 'database',
    MIGRATIONS: 'migrations',
    SYNC_QUEUE: 'sync-queue',
    AUTH: 'auth',
} as const;

export type SystemCheckKey = (typeof SYSTEM_CHECK_KEY)[keyof typeof SYSTEM_CHECK_KEY];

/** Resultado de un chequeo. */
export type SystemCheck = {
    readonly key: SystemCheckKey;
    /** Nombre para el operador. */
    readonly label: string;
    readonly status: SystemHealthStatus;
    /** Qué se midió, en lenguaje llano. */
    readonly detail: string;
    /** Tiempo de la sonda; null si no aplica. */
    readonly latencyMs: number | null;
};

export type SystemHealthResponse = {
    /** El peor estado de los chequeos. */
    readonly status: SystemHealthStatus;
    readonly checks: readonly SystemCheck[];
    readonly checkedAt: string;
};
