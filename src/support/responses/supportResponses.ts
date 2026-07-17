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

    /**
     * SLA. Solo del lado del BACKOFFICE: es NUESTRO compromiso interno, no una
     * promesa que le enseñamos al cliente. Por eso no existe en MyTicket*.
     *
     * Los plazos se congelan al abrir el ticket; el vencimiento se DERIVA al
     * leer (no hay job que lo marque, y uno que lo marcara mentiría en cuanto
     * dejara de correr).
     */
    readonly firstResponseDueAt: string;
    readonly resolutionDueAt: string;
    readonly isFirstResponseBreached: boolean;
    readonly isResolutionBreached: boolean;
    /** True si el reloj está detenido porque la pelota no está de nuestro lado. */
    readonly isSlaClockPaused: boolean;

    /** CSAT: 1-5 que puso el cliente, o null si no calificó. */
    readonly csatRating: number | null;
    readonly csatComment: string | null;
    readonly csatAt: string | null;
};

/** Cuántos tickets hay en cada cola. Responde a "¿qué me toca ahora?". */
export type SupportQueueCountsResponse = {
    readonly unassigned: number;
    readonly mine: number;
    readonly breached: number;
    readonly waiting: number;
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
    /** True si el ticket ya terminó y el cliente puede calificar. */
    readonly canRate: boolean;
    /** Calificación que dejó el cliente, o null. Puede recalificar mientras pueda. */
    readonly csatRating: number | null;
    readonly csatComment: string | null;
};

/** Respuesta de la campana del tenant: cuántos hilos con respuesta sin leer. */
export type MyTicketUnreadCountResponse = {
    readonly unreadCount: number;
};

// ── Contexto del tenant (F4) ──

/** Datos básicos del negocio que abrió el ticket. */
export type TenantContextBasics = {
    readonly name: string;
    readonly code: string;
    readonly createdAt: string;
};

/** Estado de la suscripción. */
export type TenantContextSubscription = {
    readonly status: string;
    readonly trialEndsAt: string | null;
    readonly allowsAccess: boolean;
    readonly isTrialExpired: boolean;
};

/** Actividad y cobro estimado del tenant. */
export type TenantContextUsage = {
    readonly activeLocations: number;
    readonly activeUsers: number;
    readonly activeCompanies: number;
    readonly estimatedMonthly: number;
    readonly currency: string;
    readonly includedStamps: number;
    /** Timbres usados; null mientras el TPV no reporte a la nube. */
    readonly stampsUsed: number | null;
};

/** Cobranza pendiente del tenant. */
export type TenantContextBilling = {
    readonly overdueCount: number;
    readonly outstandingAmount: number;
    readonly currency: string;
};

/**
 * Contexto del tenant, para contestar con lo que un tercero no sabe.
 *
 * Cada sección es independiente: si un módulo falla, esa sección viene `null` y
 * su nombre aparece en `failed`, pero el resto del panel se pinta igual. La UI
 * dice "no disponible" en lugar de romperse o —peor— mentir con un cero.
 */
export type TenantContextResponse = {
    readonly tenantId: string;
    readonly basics: TenantContextBasics | null;
    readonly subscription: TenantContextSubscription | null;
    readonly usage: TenantContextUsage | null;
    readonly billing: TenantContextBilling | null;
    /** Secciones que no se pudieron cargar (p.ej. ['billing']). */
    readonly failed: readonly string[];
};
