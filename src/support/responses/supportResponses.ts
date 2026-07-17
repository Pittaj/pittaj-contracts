/**
 * @fileoverview Respuestas de Soporte.
 * @module Contracts/Support/Responses
 *
 * Las respuestas del BACKOFFICE y las del TENANT están separadas a propósito:
 * las del tenant no tienen forma de acarrear una nota interna aunque alguien se
 * equivoque al mapear.
 */

import type {
    SupportTicketStatus,
    SupportTicketType,
    SupportTicketPriority,
    SupportChannel,
    TicketAuthorKind,
    MessageVisibility,
    RequesterKind,
    TicketEventKind,
} from '../primitives';

// ── Backoffice ──

/** Mensaje del hilo, tal como lo ve un operador (incluye notas internas). */
export type TicketMessageView = {
    readonly id: string;
    readonly authorKind: TicketAuthorKind;
    readonly authorId: string | null;
    /** Congelado al escribir: si el usuario se borra, el hilo sigue legible. */
    readonly authorName: string;
    readonly visibility: MessageVisibility;
    readonly body: string;
    readonly createdAt: string;
};

/** Entrada del timeline. */
export type TicketEventView = {
    readonly id: string;
    readonly kind: TicketEventKind;
    readonly actorName: string;
    readonly at: string;
    /** Texto ya armado para mostrar ("de NUEVO a ABIERTO"). */
    readonly detail: string | null;
};

/** Renglón de la bandeja. */
export type SupportTicketListItem = {
    readonly id: string;
    readonly number: string;
    readonly subject: string;
    readonly tenantId: string;
    readonly tenantName: string;
    readonly requesterKind: RequesterKind;
    readonly requesterName: string;
    readonly status: SupportTicketStatus;
    readonly type: SupportTicketType;
    readonly priority: SupportTicketPriority;
    readonly channel: SupportChannel;
    readonly assigneeId: string | null;
    readonly assigneeName: string | null;
    /** Solo mensajes públicos: es el pulso de la conversación. */
    readonly publicMessageCount: number;
    readonly lastPublicMessageAt: string | null;
    readonly firstRespondedAt: string | null;
    readonly solvedAt: string | null;
    readonly closedAt: string | null;
    readonly createdAt: string;
};

export type SupportTicketListResponse = {
    readonly tickets: readonly SupportTicketListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

/** Detalle del backoffice: hilo completo (con notas) + timeline. */
export type SupportTicketDetailResponse = SupportTicketListItem & {
    readonly messages: readonly TicketMessageView[];
    readonly events: readonly TicketEventView[];
};

// ── Tenant ──

/**
 * Mensaje tal como lo ve el cliente.
 *
 * No tiene `visibility`: por construcción, aquí solo llegan los públicos.
 */
export type MyTicketMessageView = {
    readonly id: string;
    /** True si lo escribió soporte (para pintarlo del otro lado). */
    readonly fromSupport: boolean;
    readonly authorName: string;
    readonly body: string;
    readonly createdAt: string;
};

export type MyTicketListItem = {
    readonly id: string;
    readonly number: string;
    readonly subject: string;
    readonly status: SupportTicketStatus;
    readonly type: SupportTicketType;
    readonly lastMessageAt: string | null;
    readonly createdAt: string;
    /** Quién lo abrió (el admin del tenant ve los de todos). */
    readonly requesterName: string;
    /** True si lo abrió quien está mirando. */
    readonly isMine: boolean;
};

export type MyTicketListResponse = {
    readonly tickets: readonly MyTicketListItem[];
    readonly pagination: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly totalPages: number;
    };
};

export type MyTicketDetailResponse = MyTicketListItem & {
    readonly messages: readonly MyTicketMessageView[];
};
