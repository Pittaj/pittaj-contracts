/**
 * @fileoverview Primitivas de la Base de Conocimiento (centro de ayuda).
 * @module Contracts/KbArticle/Primitives
 *
 * Artículos de ayuda que Pittaj escribe para sus tenants. Los redacta el
 * backoffice y los leen los usuarios desde el panel de ayuda del header y la
 * página /ayuda.
 *
 * El cuerpo es TEXTO PLANO (se respetan los saltos de línea al mostrarlo): no
 * hay markdown en el proyecto y no se inyecta HTML.
 */

/** Ciclo de vida del artículo. */
export const KB_ARTICLE_STATUS = {
    /** Se está redactando: no lo ve nadie. */
    DRAFT: 'DRAFT',
    /** Publicado: visible en el centro de ayuda. */
    PUBLISHED: 'PUBLISHED',
    /** Retirado: deja de mostrarse, pero se conserva. */
    ARCHIVED: 'ARCHIVED',
} as const;

export type KbArticleStatus = (typeof KB_ARTICLE_STATUS)[keyof typeof KB_ARTICLE_STATUS];

/** Límites de validación (espejo del dominio). */
export const KB_ARTICLE_LIMITS = {
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 150,
    BODY_MIN_LENGTH: 3,
    BODY_MAX_LENGTH: 20000,
    CATEGORY_MIN_LENGTH: 2,
    CATEGORY_MAX_LENGTH: 60,
    SLUG_MAX_LENGTH: 160,
    EXCERPT_MAX_LENGTH: 200,
} as const;

export type KbArticlePrimitives = {
    readonly id: string;
    readonly title: string;
    /** Identificador para la URL (/ayuda/como-abrir-caja). Único. */
    readonly slug: string;
    readonly body: string;
    /** Agrupa los artículos en el centro de ayuda (ej. "Primeros pasos"). */
    readonly category: string;
    readonly status: KbArticleStatus;
    /** Orden dentro de su categoría (menor primero). */
    readonly displayOrder: number;
    readonly publishedAt: string | null;
    readonly createdAt: string;
    readonly updatedAt: string | null;
};
