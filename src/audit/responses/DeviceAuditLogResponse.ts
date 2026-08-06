/**
 * @fileoverview DTO de una entrada de la bitácora del escritorio.
 *
 * Espejo de `Pittaj.Domain.Audit.AuditLogEntry`. **No es lo mismo que `audit_logs`**, que registra
 * acciones de la API web y de plataforma: esta viene del interceptor de guardado de una
 * computadora concreta y trae el diff de campos.
 *
 * ── Solo sube lo que vale revisarse ──
 * El escritorio registra cada cambio de cada agregado; a la nube viaja únicamente lo que un dueño
 * se sentaría a mirar: borrados, cambios de precio o costo, cancelaciones, ajustes de inventario a
 * mano y cambios de permisos o credenciales. El resto se queda como rastro local de esa máquina.
 * El criterio vive en `AuditSyncPolicy` del escritorio.
 *
 * @module Contracts/Audit
 */

export interface DeviceAuditLogResponse {
    readonly id: string;
    /** Tipo de agregado afectado (`PosTicket`, `Product`…). */
    readonly entityType: string;
    readonly entityId: string;
    /** `create` | `update` | `delete`. */
    readonly operation: string;

    readonly companyId: string | null;
    readonly locationId: string | null;
    /** Operador que hizo el cambio en esa máquina. */
    readonly userId: string | null;

    /** Diff de los campos cambiados (JSON). Alta = snapshot; baja = valores previos. */
    readonly changes: string | null;
    /** Cuándo ocurrió EN LA MÁQUINA, no cuándo llegó a la nube. */
    readonly occurredAt: string;
}

/** Página de la bitácora de instalaciones. */
export interface DeviceAuditLogsPageResponse {
    readonly items: DeviceAuditLogResponse[];
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
}
