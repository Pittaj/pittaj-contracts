/**
 * @fileoverview Esquemas de entrada de la Base de Conocimiento.
 * @module Contracts/KbArticle/Schemas
 */

import { z } from 'zod';
import { KB_ARTICLE_LIMITS } from '../primitives';

/** Filtros del listado del backoffice. */
export const listKbArticlesSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    category: z.string().trim().max(KB_ARTICLE_LIMITS.CATEGORY_MAX_LENGTH).optional(),
    /** Busca por título o cuerpo. */
    search: z.string().trim().max(120).optional(),
});

export type ListKbArticlesInput = z.infer<typeof listKbArticlesSchema>;

/** Parámetro :id de artículo. */
export const kbArticleIdParamSchema = z.object({
    id: z.string().uuid('El ID del artículo debe ser un UUID válido'),
});

export type KbArticleIdParam = z.infer<typeof kbArticleIdParamSchema>;

/** Parámetro :slug (lectura pública del tenant). */
export const kbArticleSlugParamSchema = z.object({
    slug: z
        .string()
        .trim()
        .min(1)
        .max(KB_ARTICLE_LIMITS.SLUG_MAX_LENGTH),
});

export type KbArticleSlugParam = z.infer<typeof kbArticleSlugParamSchema>;

/** Alta/edición de un artículo (reemplazo completo del contenido). */
export const createKbArticleSchema = z.object({
    title: z
        .string()
        .trim()
        .min(KB_ARTICLE_LIMITS.TITLE_MIN_LENGTH, 'El título es obligatorio')
        .max(KB_ARTICLE_LIMITS.TITLE_MAX_LENGTH),
    body: z
        .string()
        .trim()
        .min(KB_ARTICLE_LIMITS.BODY_MIN_LENGTH, 'El contenido es obligatorio')
        .max(KB_ARTICLE_LIMITS.BODY_MAX_LENGTH),
    category: z
        .string()
        .trim()
        .min(KB_ARTICLE_LIMITS.CATEGORY_MIN_LENGTH, 'La categoría es obligatoria')
        .max(KB_ARTICLE_LIMITS.CATEGORY_MAX_LENGTH),
    displayOrder: z.coerce.number().int().min(0).default(0),
});

export type CreateKbArticleInput = z.infer<typeof createKbArticleSchema>;

export const updateKbArticleSchema = createKbArticleSchema;

export type UpdateKbArticleInput = z.infer<typeof updateKbArticleSchema>;

/** Búsqueda del centro de ayuda (tenant). */
export const searchHelpSchema = z.object({
    search: z.string().trim().max(120).optional(),
});

export type SearchHelpInput = z.infer<typeof searchHelpSchema>;
