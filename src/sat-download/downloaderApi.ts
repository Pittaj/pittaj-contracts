/**
 * @fileoverview La API interna entre el descargador (Google Cloud) y la nube de Pittaj (Workers).
 * @module Contracts/SatDownload/DownloaderApi
 *
 * El descargador es **el único que puede firmar** con las e.firmas resguardadas, y **no tiene
 * credenciales de la base**: todo lo que sabe y todo lo que escribe pasa por estas rutas
 * (`/api/internal/sat/*`), autenticadas con un token OIDC que firma Google para la identidad del
 * servicio. Así, comprometer el API no da firmas, y comprometer el descargador no da la base.
 *
 * El reparto: **la nube decide qué pedir** (tiene los días cerrados y los reclamos) y **el
 * descargador lo ejecuta** (tiene la llave). El descargador nunca elige un rango por su cuenta.
 */

import { z } from 'zod';
import { cfdiFileHeaderSchema } from '../purchase/schemas/cfdiImport.schema.js';
import { SAT_IMPORT_METHOD, SAT_SIGNATURE_OPERATIONS } from './satCredential.js';
import type { SatDownloadKind, SatDownloadPayload } from './satDownloadPlan.js';

// ─── Estados de una solicitud ───────────────────────────────────────────────

/**
 * La vida de una solicitud al SAT (`sat_download_claim.status`).
 *
 *     RECLAMADA ──el SAT da id──▶ SOLICITADA ──hay paquetes──▶ LISTA ──todos bajados──▶ DESCARGADA
 *         │                          │                           │
 *         ├─ SIN_RESPUESTA           ├─ RECHAZADA                └─ VENCIDA (72 h sin bajarse)
 *         ├─ RECHAZADA               └─ VENCIDA
 *         └─ AGOTADA (5002)
 *
 * - `SIN_RESPUESTA`: no se supo si el SAT la registró (caído, sin red). **No es un rechazo**: se
 *   reintenta con el inicio corrido un segundo, que para el SAT es otro periodo.
 * - `AGOTADA`: el periodo exacto ya gastó sus dos solicitudes de por vida. No debería pasar nunca
 *   con el corrimiento; si pasa, hay que verlo.
 */
export const SAT_CLAIM_STATUSES = [
    'RECLAMADA',
    'SOLICITADA',
    'LISTA',
    'DESCARGADA',
    'SIN_RESPUESTA',
    'RECHAZADA',
    'AGOTADA',
    'VENCIDA',
] as const;
export type SatClaimStatus = (typeof SAT_CLAIM_STATUSES)[number];

/** Los que ya no cambian. */
export const SAT_CLAIM_FINAL_STATUSES: readonly SatClaimStatus[] = ['DESCARGADA', 'SIN_RESPUESTA', 'RECHAZADA', 'AGOTADA', 'VENCIDA'];

// ─── Lo que la nube le da al descargador ────────────────────────────────────

/** Lo necesario para firmar a nombre de un RFC. El certificado viaja: va dentro de cada mensaje. */
export interface SatDownloaderCredential {
    readonly credentialId: string;
    readonly tenantId: string;
    readonly rfc: string;
    /** `.cer` en DER, base64. */
    readonly certificate: string;
    /** Versión de la llave en el KMS con la que se firma. */
    readonly kmsKeyVersion: string;
}

export interface SatCredentialToImport {
    readonly credentialId: string;
    readonly tenantId: string;
    readonly rfc: string;
    readonly certificate: string;
    /** El sobre `rsa-oaep-3072-sha256-aes-256`, base64. Solo el HSM lo abre. */
    readonly wrappedKey: string;
    readonly importJobId: string;
}

export interface SatCredentialToDisable {
    readonly credentialId: string;
    readonly tenantId: string;
    readonly kmsKeyVersion: string;
}

export interface SatPendingCredentialsResponse {
    readonly toImport: readonly SatCredentialToImport[];
    readonly toDisable: readonly SatCredentialToDisable[];
}

/** Una solicitud que el descargador tiene que mover un paso. */
export interface SatClaimWork {
    readonly claimId: string;
    readonly tenantId: string;
    readonly credential: SatDownloaderCredential;
    readonly kind: SatDownloadKind;
    readonly payload: SatDownloadPayload;
    /** `YYYY-MM-DDTHH:mm:ss`, hora del centro, tal cual va al SAT. */
    readonly rangeStart: string;
    readonly rangeEnd: string;
    readonly folio: string | null;
    readonly estadoComprobante: 'Vigente' | 'Todos';
    readonly status: SatClaimStatus;
    readonly satRequestId: string | null;
    /** Paquetes que faltan por bajar (solo con `LISTA`). */
    readonly packageIds: readonly string[];
}

export interface SatRunPlanResponse {
    /** Recién reclamadas: pedirlas al SAT. */
    readonly toRequest: readonly SatClaimWork[];
    /** Ya aceptadas por el SAT: preguntar si están listas. */
    readonly toVerify: readonly SatClaimWork[];
    /** Listas: bajar sus paquetes. */
    readonly toDownload: readonly SatClaimWork[];
}

// ─── Lo que el descargador le manda a la nube ───────────────────────────────

export const publishImportJobSchema = z
    .object({
        importJobId: z.string().trim().min(1).max(300),
        publicKeyPem: z.string().trim().min(100).max(4_000).startsWith('-----BEGIN PUBLIC KEY-----'),
        method: z.literal(SAT_IMPORT_METHOD),
        expiresAt: z.string().datetime({ offset: true }),
    })
    .strict();
export type PublishImportJobRequest = z.infer<typeof publishImportJobSchema>;

export const credentialImportedSchema = z
    .object({
        kmsKeyVersion: z.string().trim().min(1).max(400),
        /**
         * Cuándo se comprobó la pareja: el HSM firmó un reto y la firma verificó contra el `.cer`.
         * Es una firma más y va a la bitácora (`VERIFICAR_PAREJA`).
         */
        pairVerifiedAt: z.string().datetime({ offset: true }),
    })
    .strict();
export type CredentialImportedRequest = z.infer<typeof credentialImportedSchema>;

export const credentialFailedSchema = z
    .object({
        /** En palabras para el usuario: se enseña en Fiscal → e.firma. */
        reason: z.string().trim().min(1).max(500),
    })
    .strict();
export type CredentialFailedRequest = z.infer<typeof credentialFailedSchema>;

export const planRunSchema = z
    .object({
        /** Solo para pruebas: el instante de la corrida. En producción, el reloj de la nube. */
        now: z.string().datetime({ offset: true }).optional(),
    })
    .strict();
export type PlanRunRequest = z.infer<typeof planRunSchema>;

/** Cada firma que se hizo para mover la solicitud: va a la bitácora que ve el cliente. */
export const satSignatureEntrySchema = z
    .object({
        operation: z.enum(SAT_SIGNATURE_OPERATIONS),
        signedAt: z.string().datetime({ offset: true }),
    })
    .strict();

export const reportClaimSchema = z
    .object({
        /** La credencial que firmó este paso. Si se renovó a medio vuelo, no es la que reclamó. */
        credentialId: z.string().uuid(),
        status: z.enum(['SOLICITADA', 'LISTA', 'DESCARGADA', 'SIN_RESPUESTA', 'RECHAZADA', 'AGOTADA', 'VENCIDA']),
        satRequestId: z.string().trim().max(64).optional(),
        /** El `CodEstatus` / `CodigoEstadoSolicitud` que dio el SAT. */
        satStatusCode: z.string().trim().max(10).optional(),
        /** Con `LISTA`: los paquetes que hay que bajar. */
        packageIds: z.array(z.string().trim().min(1).max(100)).max(500).optional(),
        /** Con `LISTA` o `DESCARGADA`: cuántos comprobantes dijo el SAT. */
        cfdiCount: z.number().int().min(0).max(2_000_000).optional(),
        error: z.string().trim().max(1_000).optional(),
        signatures: z.array(satSignatureEntrySchema).max(500),
    })
    .strict();
export type ReportClaimRequest = z.infer<typeof reportClaimSchema>;

/**
 * Comprobantes de un paquete, ya leídos por el descargador.
 *
 * En Workers no hay lector de XML: la cabecera la lee el descargador (el mismo formato que usa
 * «Importar CFDI» de la web) y el XML viaja tal cual para guardarse en el buzón.
 */
export const importClaimCfdisSchema = z
    .object({
        cfdis: z
            .array(
                z
                    .object({
                        header: cfdiFileHeaderSchema,
                        xml: z.string().min(1).max(2 * 1024 * 1024),
                    })
                    .strict(),
            )
            .min(1)
            .max(200),
    })
    .strict();
export type ImportClaimCfdisRequest = z.infer<typeof importClaimCfdisSchema>;

export interface ImportClaimCfdisResponse {
    /** Entraron al buzón. */
    readonly imported: number;
    /** Ya estaban (mismo UUID). Normal: la ventana pide cada día hasta cuatro veces. */
    readonly alreadyPresent: number;
    /** No eran para este RFC, o no traían UUID. No deberían existir; se cuentan para verlos. */
    readonly rejected: number;
}
