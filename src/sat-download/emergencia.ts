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

/**
 * Si la e.firma **en la nube** se ofrece (decisión del dueño, 2026-11-15: la recomendada es el
 * escritorio hasta que la nube pase una auditoría externa). Sin cambios registrados está APAGADA.
 * `PILOTO` la abre solo para unos negocios, para probarla antes de abrirla a todos.
 */
export const SAT_CLOUD_MODES = ['APAGADA', 'PILOTO', 'ENCENDIDA'] as const;
export type SatCloudMode = (typeof SAT_CLOUD_MODES)[number];

/** POST /api/admin/sat/availability */
export const setSatCloudAvailabilitySchema = z
    .object({
        mode: z.enum(SAT_CLOUD_MODES),
        /** Con PILOTO, los negocios que sí la ven (al menos uno). Con los otros dos, nada. */
        tenantIds: z.array(z.string().uuid()).max(100).optional(),
        reason: motivo,
    })
    .strict()
    .refine((b) => (b.mode === 'PILOTO' ? (b.tenantIds?.length ?? 0) > 0 : !b.tenantIds?.length), {
        message: 'El piloto necesita al menos un negocio; apagada o encendida no lleva negocios.',
        path: ['tenantIds'],
    });
export type SetSatCloudAvailabilityRequest = z.infer<typeof setSatCloudAvailabilitySchema>;

export interface SatCloudAvailabilityResponse {
    readonly mode: SatCloudMode;
    readonly tenantIds: readonly string[];
    /** Null si nunca se ha cambiado (está apagada de fábrica). */
    readonly changedAt: string | null;
    readonly changedByName: string | null;
    readonly reason: string | null;
}

/** GET /api/admin/sat/emergency */
export interface SatEmergencyStatusResponse {
    /** Si la e.firma en la nube se ofrece, y a quién. */
    readonly availability: SatCloudAvailabilityResponse;
    /** Los últimos cambios de disponibilidad, el más reciente primero. */
    readonly availabilityHistory: readonly SatCloudAvailabilityResponse[];
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
