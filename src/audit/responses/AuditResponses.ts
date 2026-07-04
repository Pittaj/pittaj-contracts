/**
 * @fileoverview DTOs de respuesta para la auditoría del tenant.
 * @module Contracts/Audit
 */

/** Entrada de la Bitácora de Actividad (mutación registrada). */
export interface AuditLogEntryResponse {
    readonly id: string;
    /** Acción: CREATE | UPDATE | DELETE (u otra registrada por dominio). */
    readonly action: string;
    /** Tipo de entidad afectada (taxes, roles, users, ...). */
    readonly entityType: string;
    /** ID de la entidad afectada; null si no aplica. */
    readonly entityId: string | null;
    /** Usuario que realizó la acción; null = sistema. */
    readonly performedBy: string | null;
    /** Contexto adicional (path, status HTTP, etc.). */
    readonly metadata: Record<string, unknown>;
    readonly ipAddress: string | null;
    readonly createdAt: string;
}

/** Entrada del Registro de Accesos (intento de login). */
export interface AccessLogEntryResponse {
    readonly id: string;
    readonly email: string;
    readonly success: boolean;
    /** Motivo del fallo; null si fue exitoso. */
    readonly failureReason: string | null;
    readonly ipAddress: string | null;
    readonly userAgent: string | null;
    readonly createdAt: string;
}

/** Página de resultados de auditoría. */
export interface AuditPageResponse<T> {
    readonly items: readonly T[];
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
}

export type AuditLogsPageResponse = AuditPageResponse<AuditLogEntryResponse>;
export type AccessLogsPageResponse = AuditPageResponse<AccessLogEntryResponse>;
