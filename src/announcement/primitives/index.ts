/**
 * @fileoverview Primitivas de Anuncios (Pittaj → sus tenants).
 * @module Contracts/Announcement/Primitives
 *
 * Canal de comunicación de la plataforma: avisos de mantenimiento, novedades,
 * etc. Se entregan al tenant por dos vías: barra de sistema (los marcados con
 * showAsBanner) y campana de novedades (todos), con estado leído por usuario.
 */

/** Severidad del anuncio; define el tono con el que se muestra. */
export const ANNOUNCEMENT_SEVERITY = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
} as const;

export type AnnouncementSeverity =
    (typeof ANNOUNCEMENT_SEVERITY)[keyof typeof ANNOUNCEMENT_SEVERITY];

/** Ciclo de vida del anuncio. */
export const ANNOUNCEMENT_STATUS = {
    /** Se está redactando: no lo ve nadie. */
    DRAFT: 'DRAFT',
    /** Publicado: lo ven los tenants de su audiencia mientras esté vigente. */
    PUBLISHED: 'PUBLISHED',
    /** Retirado: deja de mostrarse, pero se conserva. */
    ARCHIVED: 'ARCHIVED',
} as const;

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUS)[keyof typeof ANNOUNCEMENT_STATUS];

/** A quién va dirigido. */
export const ANNOUNCEMENT_AUDIENCE = {
    /** Todos los tenants. */
    ALL: 'ALL',
    /** Un tenant en concreto. */
    TENANT: 'TENANT',
} as const;

export type AnnouncementAudience =
    (typeof ANNOUNCEMENT_AUDIENCE)[keyof typeof ANNOUNCEMENT_AUDIENCE];

/** Límites de validación (espejo del dominio). */
export const ANNOUNCEMENT_LIMITS = {
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 120,
    BODY_MIN_LENGTH: 3,
    BODY_MAX_LENGTH: 2000,
} as const;

export type AnnouncementPrimitives = {
    readonly id: string;
    readonly title: string;
    readonly body: string;
    readonly severity: AnnouncementSeverity;
    readonly status: AnnouncementStatus;
    readonly audience: AnnouncementAudience;
    /** Tenant destinatario; null cuando la audiencia es ALL. */
    readonly tenantId: string | null;
    /** Nombre del tenant destinatario; null cuando la audiencia es ALL. */
    readonly tenantName: string | null;
    /** Si además se muestra como barra de sistema (para lo urgente). */
    readonly showAsBanner: boolean;
    /** Inicio de vigencia; null = desde que se publica. */
    readonly startsAt: string | null;
    /** Fin de vigencia; null = sin caducidad. */
    readonly endsAt: string | null;
    readonly publishedAt: string | null;
    readonly createdAt: string;
    readonly updatedAt: string | null;
};
