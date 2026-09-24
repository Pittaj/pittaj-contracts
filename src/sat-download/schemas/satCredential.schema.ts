/**
 * @fileoverview Lo que manda el navegador al cargar, revocar y programar la e.firma resguardada.
 * @module Contracts/SatDownload/Schemas/Credential
 *
 * 🔴 Aquí **no hay campo de contraseña ni de llave en claro**, y no debe haberlo nunca. El navegador
 * abre el `.key`, lo envuelve para el KMS y manda solo el sobre. Si alguien añade un `password` a
 * este esquema, el diseño entero deja de valer.
 */

import { z } from 'zod';
import { SAT_CONSENT_VERSION } from '../satCredential.js';

const base64 = /^[A-Za-z0-9+/]+={0,2}$/;

export const registerSatCredentialSchema = z
    .object({
        /** El `.cer` en DER, en base64. Es público; la nube lo relee y no confía en lo que diga el navegador. */
        certificate: z.string().trim().min(100).max(12_000).regex(base64, 'El certificado debe ir en base64'),
        /**
         * El sobre para el KMS (`rsa-oaep-3072-sha256-aes-256`): 384 bytes de RSA-OAEP más la llave en
         * PKCS#8 envuelta con AES-KWP. Una llave RSA 2048 da un sobre de ~1 600 bytes.
         */
        wrappedKey: z.string().trim().min(600).max(8_000).regex(base64, 'El sobre debe ir en base64'),
        /** El trabajo de importación con cuya llave pública se envolvió. */
        importJobId: z.string().trim().min(1).max(300),
        consentVersion: z.literal(SAT_CONSENT_VERSION),
        consentAccepted: z.literal(true),
    })
    .strict();
export type RegisterSatCredentialRequest = z.infer<typeof registerSatCredentialSchema>;

export const revokeSatCredentialSchema = z
    .object({
        reason: z.string().trim().max(200).optional(),
    })
    .strict();
export type RevokeSatCredentialRequest = z.infer<typeof revokeSatCredentialSchema>;

/** Hora del día (centro de México) a la que corre la descarga, y desde cuándo responde el negocio. */
export const updateSatDownloadConfigSchema = z
    .object({
        downloadHour: z.number().int().min(0).max(23).optional(),
        /**
         * Pedir histórico: el día más antiguo que se quiere tener (`YYYY-MM-DD`). Solo se puede
         * mover **hacia atrás**; el tope son cinco años (lo valida la nube con `inicioMinimoDeHistorico`).
         */
        coverageStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha YYYY-MM-DD').optional(),
    })
    .strict()
    .refine((v) => v.downloadHour !== undefined || v.coverageStart !== undefined, 'No hay nada que cambiar');
export type UpdateSatDownloadConfigRequest = z.infer<typeof updateSatDownloadConfigSchema>;

export const getSatSignatureLogSchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(200).default(50),
    })
    .strict();
export type GetSatSignatureLogRequest = z.infer<typeof getSatSignatureLogSchema>;
