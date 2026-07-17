/**
 * @fileoverview Primitivas de Soporte (tickets).
 * @module Contracts/Support/Primitives
 *
 * OJO: NO confundir con @pittaj/contracts/pos-ticket, que es el comprobante de
 * venta. Aquí "ticket" = petición de ayuda.
 *
 * Ver la especificación en pittaj-backend/docs/SUPPORT-TICKETS-SPEC.md.
 */

/**
 * Estados del ticket.
 *
 * Lo que hace útil una cola no es abierto/cerrado, sino saber DE QUIÉN ES EL
 * TURNO. Por eso PENDING (esperamos al cliente) y ON_HOLD (esperamos a un
 * tercero) existen por separado.
 */
export const SUPPORT_TICKET_STATUS = {
    /** Nadie lo ha tocado. */
    NEW: 'NEW',
    /** Nos toca a nosotros. */
    OPEN: 'OPEN',
    /** Esperamos al cliente. Si responde, vuelve a OPEN. */
    PENDING: 'PENDING',
    /** Esperamos a un tercero (PAC, banco, proveedor). */
    ON_HOLD: 'ON_HOLD',
    /** Resuelto, sin confirmar. */
    SOLVED: 'SOLVED',
    /** Terminal: no se reabre (se abre uno nuevo enlazado). */
    CLOSED: 'CLOSED',
} as const;

export type SupportTicketStatus =
    (typeof SUPPORT_TICKET_STATUS)[keyof typeof SUPPORT_TICKET_STATUS];

/** Estados en los que el turno es NUESTRO (alimentan la cola "me toca"). */
export const OUR_TURN_STATUSES = ['NEW', 'OPEN'] as const;

export const SUPPORT_TICKET_TYPE = {
    QUESTION: 'QUESTION',
    INCIDENT: 'INCIDENT',
    BUG: 'BUG',
    REQUEST: 'REQUEST',
} as const;

export type SupportTicketType = (typeof SUPPORT_TICKET_TYPE)[keyof typeof SUPPORT_TICKET_TYPE];

export const SUPPORT_TICKET_PRIORITY = {
    LOW: 'LOW',
    NORMAL: 'NORMAL',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
} as const;

export type SupportTicketPriority =
    (typeof SUPPORT_TICKET_PRIORITY)[keyof typeof SUPPORT_TICKET_PRIORITY];

/** Por dónde llegó la petición. EMAIL queda para F5 (correo entrante). */
export const SUPPORT_CHANNEL = {
    WEB: 'WEB',
    PHONE: 'PHONE',
    WHATSAPP: 'WHATSAPP',
    EMAIL: 'EMAIL',
} as const;

export type SupportChannel = (typeof SUPPORT_CHANNEL)[keyof typeof SUPPORT_CHANNEL];

/**
 * Quién escribió un mensaje.
 *
 * Hay DOS sistemas de identidad (usuarios de tenant y operadores del
 * backoffice), así que el autor se declara y no hay FK que los una.
 */
export const TICKET_AUTHOR_KIND = {
    TENANT_USER: 'TENANT_USER',
    OPERATOR: 'OPERATOR',
    /** Mensajes que genera el propio sistema. */
    SYSTEM: 'SYSTEM',
} as const;

export type TicketAuthorKind = (typeof TICKET_AUTHOR_KIND)[keyof typeof TICKET_AUTHOR_KIND];

/**
 * Visibilidad de un mensaje.
 *
 * INTERNAL solo lo ven los operadores. Un mensaje de TENANT_USER NUNCA puede
 * ser INTERNAL, y la API del tenant jamás devuelve INTERNAL.
 */
export const MESSAGE_VISIBILITY = {
    PUBLIC: 'PUBLIC',
    INTERNAL: 'INTERNAL',
} as const;

export type MessageVisibility = (typeof MESSAGE_VISIBILITY)[keyof typeof MESSAGE_VISIBILITY];

/** Quién pide ayuda: un usuario del tenant, o alguien que capturó el operador. */
export const REQUESTER_KIND = {
    TENANT_USER: 'TENANT_USER',
    EXTERNAL: 'EXTERNAL',
} as const;

export type RequesterKind = (typeof REQUESTER_KIND)[keyof typeof REQUESTER_KIND];

/** Qué pasó en el ticket (timeline append-only). */
export const TICKET_EVENT_KIND = {
    CREATED: 'CREATED',
    ASSIGNED: 'ASSIGNED',
    STATUS_CHANGED: 'STATUS_CHANGED',
    PRIORITY_CHANGED: 'PRIORITY_CHANGED',
    REPLIED: 'REPLIED',
    NOTE_ADDED: 'NOTE_ADDED',
    SOLVED: 'SOLVED',
    REOPENED: 'REOPENED',
} as const;

export type TicketEventKind = (typeof TICKET_EVENT_KIND)[keyof typeof TICKET_EVENT_KIND];

/** Límites de validación (espejo del dominio). */
export const SUPPORT_LIMITS = {
    SUBJECT_MIN_LENGTH: 3,
    SUBJECT_MAX_LENGTH: 150,
    BODY_MIN_LENGTH: 2,
    BODY_MAX_LENGTH: 10000,
    REQUESTER_NAME_MAX_LENGTH: 120,
    AUTHOR_NAME_MAX_LENGTH: 120,
} as const;
