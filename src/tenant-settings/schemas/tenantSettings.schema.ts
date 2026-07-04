/**
 * @fileoverview Zod schemas para settings clave-valor del tenant.
 *
 * Espejo del mecanismo desktop (Settings key-value). El primer consumidor
 * es la config fiscal CFDI del emisor (claves cfdi.*):
 * cfdi.issuer.rfc, cfdi.issuer.name, cfdi.issuer.regime,
 * cfdi.expedition.zip, cfdi.series, cfdi.folio
 *
 * @module Contracts/TenantSettings
 */

import { z } from 'zod';

/** Formato de clave: minúsculas, dígitos, punto, guion y guion bajo. */
const KEY_REGEX = /^[a-z0-9._-]+$/;

const ERROR_MESSAGES = {
    KEY_INVALID: 'Clave inválida: use minúsculas, dígitos, punto, guion o guion bajo',
    KEY_TOO_LONG: 'La clave no puede exceder 100 caracteres',
    VALUE_TOO_LONG: 'El valor no puede exceder 500 caracteres',
    TOO_MANY_ENTRIES: 'Máximo 50 settings por operación',
    PREFIX_TOO_LONG: 'El prefijo no puede exceder 50 caracteres',
} as const;

/** Query params de GET /tenant-settings. */
export const getTenantSettingsSchema = z.object({
    /** Prefijo de claves a leer, ej. "cfdi." (opcional: sin prefijo devuelve todo). */
    prefix: z.string().trim().max(50, { message: ERROR_MESSAGES.PREFIX_TOO_LONG }).optional(),
});

export type GetTenantSettingsQuery = z.infer<typeof getTenantSettingsSchema>;

/**
 * Body de PUT /tenant-settings: upsert masivo de settings.
 */
export const saveTenantSettingsSchema = z
    .object({
        entries: z
            .record(
                z
                    .string()
                    .max(100, { message: ERROR_MESSAGES.KEY_TOO_LONG })
                    .regex(KEY_REGEX, { message: ERROR_MESSAGES.KEY_INVALID }),
                z.string().max(500, { message: ERROR_MESSAGES.VALUE_TOO_LONG })
            )
            .refine((e) => Object.keys(e).length > 0, { message: 'entries no puede estar vacío' })
            .refine((e) => Object.keys(e).length <= 50, { message: ERROR_MESSAGES.TOO_MANY_ENTRIES }),
    })
    .strict();

export type SaveTenantSettingsRequest = z.infer<typeof saveTenantSettingsSchema>;
