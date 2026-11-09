/**
 * @fileoverview El backoffice ante un incidente de la e.firma en la nube (docs
 * `arquitectura/respuesta-a-incidentes.md` §3): pausar la descarga y revocar en bloque.
 * @module Contracts/SatDownload/Emergencia
 *
 * Rutas bajo `/api/admin/sat`, solo para administradores de plataforma. La pausa es el freno
 * **lógico** —la API deja de darle al descargador algo que firmar— y se deshace; revocar destruye
 * las llaves del HSM y no se deshace: el cliente tiene que volver a cargar su e.firma.
 */

import { z } from 'zod';

const motivo = z.string().trim().min(5, 'Escribe el motivo: queda en la bitácora del incidente').max(500);

/** POST /api/admin/sat/pause */
export const pauseSatCloudSchema = z.object({ reason: motivo }).strict();
export type PauseSatCloudRequest = z.infer<typeof pauseSatCloudSchema>;

/** POST /api/admin/sat/resume */
export const resumeSatCloudSchema = z.object({ reason: motivo }).strict();
export type ResumeSatCloudRequest = z.infer<typeof resumeSatCloudSchema>;

/** La palabra que hay que escribir para revocar en bloque: no se dispara con un clic. */
export const CONFIRMACION_DE_REVOCACION_EN_BLOQUE = 'REVOCAR' as const;

/**
 * POST /api/admin/sat/revoke-all — revoca las e.firmas vivas de la nube (activas y pendientes) de
 * todos los negocios, o solo de `tenantIds`. A cada Propietario le llega el correo de revocación con
 * el motivo. Las de una computadora del cliente no se tocan: no son de Pittaj.
 */
export const revokeAllSatCredentialsSchema = z
    .object({
        reason: motivo,
        confirmation: z.literal(CONFIRMACION_DE_REVOCACION_EN_BLOQUE),
        tenantIds: z.array(z.string().uuid()).min(1).max(500).optional(),
    })
    .strict();
export type RevokeAllSatCredentialsRequest = z.infer<typeof revokeAllSatCredentialsSchema>;

export interface SatCloudPauseResponse {
    readonly id: string;
    readonly pausedAt: string;
    readonly pausedByName: string;
    readonly reason: string;
    readonly resumedAt: string | null;
    readonly resumedByName: string | null;
    readonly resumeReason: string | null;
}

/** GET /api/admin/sat/emergency */
export interface SatEmergencyStatusResponse {
    /** La pausa vigente, o null si la nube está corriendo. */
    readonly pause: SatCloudPauseResponse | null;
    /** Las últimas pausas, la más reciente primero. */
    readonly history: readonly SatCloudPauseResponse[];
    /** E.firmas vivas en la nube (activas o pendientes) y de cuántos negocios. */
    readonly liveCredentials: number;
    readonly liveTenants: number;
}

/** POST /api/admin/sat/revoke-all */
export interface RevokeAllSatCredentialsResponse {
    readonly revoked: number;
    readonly tenants: number;
    /** Negocios cuyo Propietario no recibió el correo (sin Propietario activo o el correo falló). */
    readonly notNotified: number;
}
