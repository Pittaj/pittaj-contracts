/**
 * @fileoverview Lo que ve el cliente en Fiscal → e.firma: la credencial, la programación y la cobertura.
 * @module Contracts/SatDownload/Responses
 */

import type { SatCredentialStatus, SatSignatureOperation } from '../satCredential.js';
import type { SatDownloadKind, SatDownloadPayload } from '../satDownloadPlan.js';

/** Lo público de la e.firma resguardada. Nada de aquí permite firmar. */
export interface SatCredentialResponse {
    readonly id: string;
    readonly rfc: string;
    readonly serialNumber: string;
    readonly validFrom: string;
    /** Vencimiento (ISO 8601). «Vencida» se deriva de aquí, no se guarda. */
    readonly validTo: string;
    readonly status: SatCredentialStatus;
    /** Por qué falló la importación, en palabras para el usuario. Solo con `FALLIDA`. */
    readonly failureReason: string | null;
    readonly createdAt: string;
    readonly createdByName: string | null;
    readonly activatedAt: string | null;
    readonly revokedAt: string | null;
}

/**
 * La llave pública con la que el navegador envuelve la e.firma.
 *
 * La publica el descargador (que es quien habla con el KMS); la nube solo la reparte. Caduca: un
 * trabajo de importación de Cloud KMS dura tres días.
 */
export interface SatImportJobResponse {
    readonly importJobId: string;
    /** SPKI en PEM, RSA 3072. */
    readonly publicKeyPem: string;
    readonly method: string;
    readonly expiresAt: string;
}

/** Cómo va un tipo (recibidos o emitidos). Son hechos: la frase la arma la interfaz. */
export interface SatDownloadCoverageResponse {
    readonly kind: SatDownloadKind;
    /** Desde cuándo responde el negocio (`YYYY-MM-DD`). */
    readonly coverageStart: string;
    /** Último día de la racha continua de días cerrados, o null. */
    readonly coveredThrough: string | null;
    /** Días abiertos entre el inicio y ayer. De ordinario, cuatro. */
    readonly openDays: number;
    /** Días abiertos que ya deberían estar cerrados: los que merecen aviso. */
    readonly lateDays: readonly string[];
}

export interface SatDownloadOverviewResponse {
    /** La credencial vigente o la última (activa, pendiente o fallida). Null si nunca se cargó una. */
    readonly credential: SatCredentialResponse | null;
    /** Para cargar o renovar. Null si el descargador no ha publicado uno vigente. */
    readonly importJob: SatImportJobResponse | null;
    readonly downloadHour: number;
    readonly coverage: readonly SatDownloadCoverageResponse[];
    /** La próxima corrida programada (ISO 8601). Null sin credencial activa. */
    readonly nextRunAt: string | null;
}

/** Un renglón de la bitácora de usos. Append-only; es lo que el cliente cruza con lo que esperaba. */
export interface SatSignatureLogEntryResponse {
    readonly id: string;
    readonly at: string;
    readonly operation: SatSignatureOperation;
    readonly kind: SatDownloadKind | null;
    readonly payload: SatDownloadPayload | null;
    readonly rangeStart: string | null;
    readonly rangeEnd: string | null;
    readonly folio: string | null;
}

export interface GetSatSignatureLogResponse {
    readonly items: readonly SatSignatureLogEntryResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
