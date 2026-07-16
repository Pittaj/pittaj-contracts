/**
 * @fileoverview Esquemas de entrada de Uso y Cuotas por tenant.
 * @module Contracts/UsageLimit/Schemas
 */

import { z } from 'zod';
import { STAMP_QUOTA_LIMITS } from '../primitives';

/** Filtros del listado de uso por tenant (backoffice). */
export const listTenantUsageSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    /** Búsqueda por nombre o slug del tenant. */
    search: z.string().trim().max(120).optional(),
});

export type ListTenantUsageInput = z.infer<typeof listTenantUsageSchema>;

/** Asignación de una cuota propia de timbres a un tenant. */
export const setStampQuotaSchema = z.object({
    includedStamps: z
        .number()
        .int('Los timbres incluidos deben ser un número entero')
        .min(STAMP_QUOTA_LIMITS.MIN, 'Los timbres incluidos no pueden ser negativos')
        .max(
            STAMP_QUOTA_LIMITS.MAX,
            `Los timbres incluidos no pueden exceder ${STAMP_QUOTA_LIMITS.MAX}`,
        ),
    /** Motivo del ajuste (cortesía, paquete extra, etc.). */
    notes: z.string().trim().max(STAMP_QUOTA_LIMITS.NOTES_MAX_LENGTH).optional(),
});

export type SetStampQuotaInput = z.infer<typeof setStampQuotaSchema>;
