/**
 * @fileoverview Respuestas de Anuncios.
 * @module Contracts/Announcement/Responses
 */

import type { AnnouncementPrimitives } from '../primitives';

/** Renglón del listado del backoffice. */
export type AnnouncementListItem = AnnouncementPrimitives & {
    /** Derivado: publicado y dentro de su vigencia (lo están viendo ahora). */
    readonly isActive: boolean;
};

export type AnnouncementListResponse = {
    readonly announcements: readonly AnnouncementListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

export type AnnouncementDetailResponse = AnnouncementListItem;

/** Anuncio tal como lo ve el usuario del tenant. */
export type MyAnnouncementItem = {
    readonly id: string;
    readonly title: string;
    readonly body: string;
    readonly severity: AnnouncementPrimitives['severity'];
    readonly showAsBanner: boolean;
    /** Momento desde el que aplica (publicación o inicio de vigencia). */
    readonly publishedAt: string;
    readonly isRead: boolean;
};

/** Novedades vigentes del tenant autenticado. */
export type MyAnnouncementsResponse = {
    readonly announcements: readonly MyAnnouncementItem[];
    readonly unreadCount: number;
};
