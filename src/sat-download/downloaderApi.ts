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
import { SELLO_BASE64 } from './selloDeImportacion.js';
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
    /**
     * Revisión adversarial H3 · Las versiones de llave que deben seguir habilitadas (las de las
     * e.firmas `ACTIVA`). El descargador apaga cualquier otra `efirma-*` habilitada del llavero:
     * así ninguna llave queda viva sin una e.firma que la respalde, aunque su renglón se haya
     * borrado por un camino que no dejó lápida. Ausente en una nube anterior: no se barre.
     */
    readonly liveKeyVersions?: readonly string[];
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

const CERTIFICADO_PEM = z.string().trim().min(100).max(6_000).startsWith('-----BEGIN CERTIFICATE-----');

/**
 * Revisión adversarial H2 · La **atestación del HSM** del trabajo de importación, tal como la da
 * Cloud KMS (`ImportJob.attestation`): un enunciado firmado por la tarjeta HSM donde nació la llave
 * de envoltura, con las cadenas de certificados del fabricante (Marvell, antes Cavium) y de Google.
 *
 * El sello prueba «esta llave la publicó Pittaj»; la atestación prueba «esta llave nació en un HSM
 * de Cloud KMS, en ESTE trabajo de importación, y su parte privada no sale de ahí». La página de
 * carga verifica las dos antes de cifrar la e.firma, con las dos raíces escritas en su código.
 */
export const kmsImportJobAttestationSchema = z
    .object({
        format: z.literal('CAVIUM_V2_COMPRESSED'),
        /** El enunciado comprimido con gzip, en base64. */
        content: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/).max(16_000),
        certChains: z
            .object({
                caviumCerts: z.array(CERTIFICADO_PEM).min(1).max(6),
                googleCardCerts: z.array(CERTIFICADO_PEM).min(1).max(6),
                googlePartitionCerts: z.array(CERTIFICADO_PEM).min(1).max(6),
            })
            .strict(),
    })
    .strict();
export type KmsImportJobAttestation = z.infer<typeof kmsImportJobAttestationSchema>;

export const publishImportJobSchema = z
    .object({
        importJobId: z.string().trim().min(1).max(300),
        publicKeyPem: z.string().trim().min(100).max(4_000).startsWith('-----BEGIN PUBLIC KEY-----'),
        method: z.literal(SAT_IMPORT_METHOD),
        expiresAt: z.string().datetime({ offset: true }),
        /** Firma del HSM sobre `mensajeDelSello` del trabajo: `r‖s` en base64 (ver `selloDeImportacion.ts`). */
        sealSignature: z.string().regex(SELLO_BASE64),
        /** H2 · Ausente solo en un descargador anterior; la página de carga no cifra sin ella. */
        attestation: kmsImportJobAttestationSchema.optional(),
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
        /**
         * Ya no se usa: la nube toma siempre su propio reloj (revisión adversarial H12; el que
         * llama no decide qué días tocan). Se acepta para no romper a un descargador anterior.
         */
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

export interface ReportClaimResponse {
    /**
     * Revisión adversarial H11 · `false` si la credencial ya no está `ACTIVA` (se revocó o se
     * reemplazó a media corrida): el descargador deja de firmar con ella en esa misma corrida, sin
     * esperar a la siguiente. Ausente en una nube anterior: se trata como `true`.
     */
    readonly credentialActive?: boolean;
}

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

/**
 * Rebanada 4 · La conciliación diaria (docs `descarga-del-sat-en-la-web.md` §5.3).
 *
 * El descargador lee del registro de auditoría de Cloud KMS —que escribe Google y él no puede
 * borrar— las firmas `AsymmetricSign` de las llaves de e.firma de un día, y las manda aquí. La nube
 * las compara con su bitácora. Lo que sabe el descargador viene de fuera de él; por eso sirve.
 */
export const kmsAuditSignatureSchema = z
    .object({
        /** `projects/…/cryptoKeys/…/cryptoKeyVersions/N`, como `kmsKeyVersion` de la credencial. */
        keyVersion: z.string().trim().min(1).max(400),
        at: z.string().datetime({ offset: true }),
        /**
         * Quién firmó según Google (`authenticationInfo.principalEmail`). Si la identidad se usó por
         * suplantación (`serviceAccountDelegationInfo`), el descargador lo escribe como
         * `<cuenta> vía <quien la suplantó>`: ya no es la identidad esperada y salta la alerta.
         */
        principal: z.string().trim().max(320).nullable(),
    })
    .strict();
export type KmsAuditSignature = z.infer<typeof kmsAuditSignatureSchema>;

export const reconcileSignaturesSchema = z
    .object({
        /** El día revisado, en la hora de México (`AAAA-MM-DD`). */
        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        signatures: z.array(kmsAuditSignatureSchema).max(50_000),
        /**
         * Ya no se usa (revisión adversarial H1): la identidad que sí puede firmar la decide la nube
         * con su propia configuración, nunca quien manda la lista. Se acepta para no romper a un
         * descargador anterior.
         */
        expectedPrincipal: z.string().trim().min(1).max(320).optional(),
    })
    .strict();
export type ReconcileSignaturesRequest = z.infer<typeof reconcileSignaturesSchema>;

/** Lo que encontró la conciliación para una e.firma. Vacío = cuadró. */
export interface SatReconciliationFinding {
    readonly credentialId: string;
    readonly rfc: string;
    /** Firmas en el KMS ese día y renglones en la bitácora. */
    readonly kmsSignatures: number;
    readonly logSignatures: number;
    /** En palabras: van tal cual en el correo al Propietario y en el registro del descargador. */
    readonly findings: readonly string[];
}

export interface ReconcileSignaturesResponse {
    readonly day: string;
    /** Llaves revisadas (con firmas en el KMS o en la bitácora). */
    readonly checked: number;
    /** Solo las que no cuadraron. */
    readonly alerts: readonly SatReconciliationFinding[];
    /**
     * Firmas del KMS de una versión de llave que ninguna e.firma tiene. Es lo más grave que puede
     * aparecer: no hay a qué negocio avisarle, así que solo lo ve Pittaj.
     */
    readonly unknownKeySignatures: number;
}

/**
 * Rebanada 5 · Un renglón de la metadata del SAT (el `.txt` del paquete, separado por `~`).
 *
 * La metadata no gasta cupo y trae lo que el XML no dice por sí solo: si el comprobante sigue
 * vigente o ya se canceló. Con ella la nube marca los cancelados del buzón, rescata por UUID lo que
 * faltó (recibidos) y alimenta el cruce de lo timbrado (emitidos).
 */
/** Null o ausente: el cliente del escritorio no escribe las llaves nulas. Sale siempre como null. */
const opcional = <T extends z.ZodTypeAny>(t: T) => t.nullish().transform((v) => v ?? null);

export const satMetadataEntrySchema = z
    .object({
        uuid: z.string().trim().min(32).max(40),
        rfcEmisor: z.string().trim().max(13),
        nombreEmisor: opcional(z.string().trim().max(300)),
        rfcReceptor: z.string().trim().max(13),
        nombreReceptor: opcional(z.string().trim().max(300)),
        /** Como viene del SAT, sin zona: `AAAA-MM-DDTHH:mm:ss` (reloj del emisor). */
        fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/),
        monto: z.number(),
        /** I, E, T, N o P. */
        efecto: opcional(z.string().trim().max(2)),
        estatus: z.enum(['Vigente', 'Cancelado']),
        fechaCancelacion: opcional(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)),
    })
    .strict();
export type SatMetadataEntry = z.infer<typeof satMetadataEntrySchema>;

/** Hasta 1 000 renglones por llamada; un paquete de metadata trae hasta un millón. */
export const SAT_METADATA_POR_LOTE = 1000;

const claimMetadataObject = z
    .object({
        chunkIndex: z.number().int().min(0),
        chunkCount: z.number().int().min(1).max(2000),
        rows: z.array(satMetadataEntrySchema).max(SAT_METADATA_POR_LOTE),
    })
    .strict();
const loteEnRango = (b: { chunkIndex: number; chunkCount: number }) => b.chunkIndex < b.chunkCount;

export const claimMetadataSchema = claimMetadataObject.refine(loteEnRango, { message: 'chunkIndex fuera de rango' });
export type ClaimMetadataRequest = z.infer<typeof claimMetadataSchema>;

/**
 * Rebanada 5b · Lo mismo desde el equipo del cliente (§11): `POST /api/fiscal/sat/local/claims/:id/metadata`.
 * El equipo viaja como `deviceId` en el cuerpo, como en el reporte de avance.
 */
export const localClaimMetadataSchema = claimMetadataObject
    .extend({ deviceId: z.string().min(1).max(100).optional() })
    .strict()
    .refine(loteEnRango, { message: 'chunkIndex fuera de rango' });
export type LocalClaimMetadataRequest = z.infer<typeof localClaimMetadataSchema>;

export interface ClaimMetadataResponse {
    readonly received: number;
    /** Recibidos: cuántos del buzón se marcaron cancelados en esta llamada. */
    readonly cancelled: number;
    /** Recibidos: cuántos UUID se pidieron por folio (vigentes en el SAT, ausentes del buzón). */
    readonly rescued: number;
    /** Emitidos: el mes quedó cruzado (llegaron todos los lotes). */
    readonly crossed: boolean;
}

/**
 * Cuántos UUID se rescatan por folio por RFC y día. Cada uno es una solicitud con su cupo de dos
 * de por vida y su firma; si faltan más, es otra cosa (una descarga que no está funcionando) y lo
 * dice la cobertura, no un rescate masivo.
 */
export const SAT_RESCATES_POR_DIA = 50;
