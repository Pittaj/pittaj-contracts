/**
 * @fileoverview «La e.firma en una computadora tuya» (docs `arquitectura/descarga-del-sat-en-la-web.md`
 * §11, decidido el 2026-10-19): un equipo del cliente toma un RFC y descarga con la e.firma que
 * guarda él, sin que llegue a Pittaj.
 *
 * Una sola modalidad por RFC: la nube lleva quién lo tiene (`sat_local_downloader`), rechaza cargar
 * en la nube un RFC tomado (salvo que se esté pasando a la nube) y rechaza tomar uno que ya está en
 * la nube. El equipo pide **el mismo plan de días** que usaría la nube y reporta cada paso igual que
 * el descargador (`reportClaimSchema`), así los días cerrados, la cobertura y los avisos salen del
 * mismo lugar en las dos modalidades.
 */

import { z } from 'zod';
import type { SatClaimStatus } from './downloaderApi.js';
import type { SatDownloadKind, SatDownloadPayload } from './satDownloadPlan.js';

/**
 * El equipo, como en el sync: viaja en la petición (cuerpo, o `?deviceId=` en el plan). Si falta, la
 * nube usa el `X-Device-ID` del encabezado. No es un secreto: lo que protege es que coincida con el
 * equipo que tomó el RFC, y que tomar pida `fiscal.efirma.manage`.
 */
const deviceIdSchema = z.string().trim().min(1).max(100);

/** Tomar un RFC en este equipo. Antes de guardar la e.firma. */
export const claimSatLocalSchema = z
    .object({
        deviceId: deviceIdSchema.optional(),
        /** F2 · La empresa cuyo RFC se toma; sin ella, la por omisión. */
        companyId: z.string().uuid().optional(),
        /** Cómo se llama el equipo para las personas («CAJA-MOSTRADOR-01»). */
        deviceName: z.string().trim().min(1).max(80),
    })
    .strict();
export type ClaimSatLocalRequest = z.infer<typeof claimSatLocalSchema>;

/** Soltar el equipo que tiene un RFC. Desde ese equipo, o desde la web sin él (equipo perdido). */
export const releaseSatLocalSchema = z
    .object({
        companyId: z.string().uuid().optional(),
        reason: z.string().trim().max(200).optional(),
    })
    .strict();
export type ReleaseSatLocalRequest = z.infer<typeof releaseSatLocalSchema>;

/** Por qué dejó de descargar un equipo. */
export const SAT_LOCAL_RELEASE_REASONS = ['SOLTADO', 'PASO_A_LA_NUBE'] as const;
export type SatLocalReleaseReason = (typeof SAT_LOCAL_RELEASE_REASONS)[number];

/** El equipo que descarga un RFC, para las pantallas. */
export interface SatLocalDownloaderResponse {
    readonly id: string;
    readonly rfc: string;
    readonly deviceId: string;
    readonly deviceName: string;
    readonly claimedAt: string;
    readonly claimedByName: string | null;
    /** Cuándo pidió plan o reportó por última vez. Null si todavía no. Avisa a las 48 h (§11.5). */
    readonly lastSeenAt: string | null;
    /** Cuando ya lo soltaron: cuándo y por qué (el escritorio lo lee para borrar su copia). */
    readonly releasedAt: string | null;
    readonly releaseReason: SatLocalReleaseReason | null;
}

/** Horas sin señal del equipo a partir de las cuales las pantallas avisan. */
export const SAT_LOCAL_AVISO_HORAS = 48;

/** Un tramo que el equipo tiene que mover. Como `SatClaimWork`, sin credencial: la firma es del equipo. */
export interface SatLocalClaimWork {
    readonly claimId: string;
    readonly kind: SatDownloadKind;
    readonly payload: SatDownloadPayload;
    /** Rebanada 5 · El UUID de un rescate (`payload` FOLIO); null en los demás. */
    readonly folio: string | null;
    /** `YYYY-MM-DDTHH:mm:ss`, hora del centro, tal cual va al SAT. */
    readonly rangeStart: string;
    readonly rangeEnd: string;
    readonly estadoComprobante: 'Vigente' | 'Todos';
    readonly status: SatClaimStatus;
    readonly satRequestId: string | null;
    readonly packageIds: readonly string[];
}

/** `GET /api/fiscal/sat/local/plan`: lo que toca, con las mismas reglas que la corrida de la nube. */
export interface SatLocalPlanResponse {
    readonly rfc: string;
    readonly toRequest: readonly SatLocalClaimWork[];
    readonly toVerify: readonly SatLocalClaimWork[];
    readonly toDownload: readonly SatLocalClaimWork[];
}

/** Un paso de un tramo, reportado por el equipo. Lo mismo que `reportClaimSchema`, sin firmas ni credencial. */
export const reportLocalClaimSchema = z
    .object({
        deviceId: deviceIdSchema.optional(),
        status: z.enum(['SOLICITADA', 'LISTA', 'DESCARGADA', 'SIN_RESPUESTA', 'RECHAZADA', 'AGOTADA', 'VENCIDA']),
        satRequestId: z.string().trim().max(64).optional(),
        satStatusCode: z.string().trim().max(10).optional(),
        packageIds: z.array(z.string().trim().min(1).max(100)).max(500).optional(),
        cfdiCount: z.number().int().min(0).max(2_000_000).optional(),
        error: z.string().trim().max(1_000).optional(),
    })
    .strict();
export type ReportLocalClaimRequest = z.infer<typeof reportLocalClaimSchema>;
