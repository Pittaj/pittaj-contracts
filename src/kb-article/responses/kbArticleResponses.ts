/**
 * @fileoverview Respuestas de la Base de Conocimiento.
 * @module Contracts/KbArticle/Responses
 */

import type { KbArticlePrimitives } from '../primitives';

/** Renglón del listado del backoffice. */
export type KbArticleListItem = KbArticlePrimitives;

export type KbArticleListResponse = {
    readonly articles: readonly KbArticleListItem[];
    /** Categorías existentes, para sugerirlas al redactar. */
    readonly categories: readonly string[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

export type KbArticleDetailResponse = KbArticleListItem;

/** Artículo tal como lo ve el usuario (solo publicados). */
export type HelpArticleSummary = {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    /** Primeras líneas del cuerpo, para el listado y el panel de ayuda. */
    readonly excerpt: string;
};

/** Artículos publicados de una categoría, en su orden. */
export type HelpCategory = {
    readonly category: string;
    readonly articles: readonly HelpArticleSummary[];
};

/** Centro de ayuda del tenant: publicados, agrupados por categoría. */
export type HelpCenterResponse = {
    readonly categories: readonly HelpCategory[];
    readonly totalArticles: number;
};

/** Artículo completo por slug. */
export type HelpArticleResponse = {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly body: string;
    readonly category: string;
    readonly publishedAt: string | null;
    readonly updatedAt: string | null;
};
