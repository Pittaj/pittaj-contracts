/**
 * @fileoverview DTO de respuesta para settings del tenant.
 * @module Contracts/TenantSettings
 */

/** Respuesta de GET/PUT /tenant-settings. */
export interface TenantSettingsResponse {
    /** Mapa clave → valor de los settings solicitados/guardados. */
    readonly entries: Record<string, string>;
}
