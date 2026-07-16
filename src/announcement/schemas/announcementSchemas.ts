/**
 * @fileoverview Esquemas de entrada de Anuncios.
 * @module Contracts/Announcement/Schemas
 */

import { z } from 'zod';
import { ANNOUNCEMENT_LIMITS } from '../primitives';

/** Filtros del listado del backoffice. */
export const listAnnouncementsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
    audience: z.enum(['ALL', 'TENANT']).optional(),
    /** Busca por título o cuerpo. */
    search: z.string().trim().max(120).optional(),
});

export type ListAnnouncementsInput = z.infer<typeof listAnnouncementsSchema>;

/** Parámetro :id de anuncio. */
export const announcementIdParamSchema = z.object({
    id: z.string().uuid('El ID del anuncio debe ser un UUID válido'),
});

export type AnnouncementIdParam = z.infer<typeof announcementIdParamSchema>;

/**
 * Alta/edición de un anuncio.
 *
 * `tenantId` es obligatorio si la audiencia es TENANT, y debe ir vacío si es
 * ALL: se valida aquí para que el error salga como 400 de validación.
 */
export const createAnnouncementSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(ANNOUNCEMENT_LIMITS.TITLE_MIN_LENGTH, 'El título es obligatorio')
            .max(ANNOUNCEMENT_LIMITS.TITLE_MAX_LENGTH),
        body: z
            .string()
            .trim()
            .min(ANNOUNCEMENT_LIMITS.BODY_MIN_LENGTH, 'El cuerpo es obligatorio')
            .max(ANNOUNCEMENT_LIMITS.BODY_MAX_LENGTH),
        severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).default('INFO'),
        audience: z.enum(['ALL', 'TENANT']).default('ALL'),
        tenantId: z.string().uuid().nullable().optional(),
        showAsBanner: z.boolean().default(false),
        startsAt: z.string().datetime({ offset: true }).nullable().optional(),
        endsAt: z.string().datetime({ offset: true }).nullable().optional(),
    })
    .refine((data) => data.audience !== 'TENANT' || Boolean(data.tenantId), {
        message: 'Elige el tenant destinatario',
        path: ['tenantId'],
    })
    .refine((data) => data.audience !== 'ALL' || !data.tenantId, {
        message: 'Un anuncio para todos no lleva tenant',
        path: ['tenantId'],
    })
    .refine(
        (data) =>
            !data.startsAt || !data.endsAt || new Date(data.endsAt) > new Date(data.startsAt),
        { message: 'La vigencia debe terminar después de empezar', path: ['endsAt'] },
    );

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

/** Edición: mismos campos y mismas reglas (reemplazo completo). */
export const updateAnnouncementSchema = createAnnouncementSchema;

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
