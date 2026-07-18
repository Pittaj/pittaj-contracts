/**
 * @fileoverview Esquemas de entrada de Soporte.
 * @module Contracts/Support/Schemas
 */

import { z } from 'zod';
import { SUPPORT_LIMITS } from '../primitives';

/**
 * Ids de adjuntos ya subidos, para colgar del mensaje que se envía.
 *
 * El backend solo liga los que sean de ESE ticket y los subió quien envía; un
 * id ajeno simplemente no engancha. Máximo 5 por mensaje.
 */
const attachmentIds = z.array(z.string().uuid()).max(5).optional();

const subject = z
    .string()
    .trim()
    .min(SUPPORT_LIMITS.SUBJECT_MIN_LENGTH, 'Describe en pocas palabras qué necesitas')
    .max(SUPPORT_LIMITS.SUBJECT_MAX_LENGTH);

const body = z
    .string()
    .trim()
    .min(SUPPORT_LIMITS.BODY_MIN_LENGTH, 'El mensaje no puede ir vacío')
    .max(SUPPORT_LIMITS.BODY_MAX_LENGTH);

// ── Backoffice ──

/** Filtros de la bandeja. */
export const listSupportTicketsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'SOLVED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    type: z.enum(['QUESTION', 'INCIDENT', 'BUG', 'REQUEST']).optional(),
    tenantId: z.string().uuid().optional(),
    /** Operador asignado; 'unassigned' filtra los que no tienen dueño. */
    assigneeId: z.string().optional(),
    /** Busca por folio, asunto o nombre del tenant. */
    search: z.string().trim().max(120).optional(),
    /**
     * Cola: atajo a "qué me toca ahora". Se combina con los demás filtros.
     *
     * MINE se resuelve contra el operador de la sesión, no contra un id que
     * venga del cliente: quién eres lo dice el token.
     */
    queue: z.enum(['UNASSIGNED', 'MINE', 'BREACHED', 'WAITING']).optional(),
});

export type ListSupportTicketsInput = z.infer<typeof listSupportTicketsSchema>;

export const supportTicketIdParamSchema = z.object({
    id: z.string().uuid('El ID del ticket debe ser un UUID válido'),
});

export type SupportTicketIdParam = z.infer<typeof supportTicketIdParamSchema>;

/**
 * Alta desde el backoffice: el operador registra lo que le contaron.
 *
 * El destinatario (`requesterUserId`) es opcional: puede que solo se tenga el
 * nombre de quien llamó.
 */
export const createTicketOnBehalfSchema = z.object({
    tenantId: z.string().uuid('Elige el tenant'),
    subject,
    body,
    type: z.enum(['QUESTION', 'INCIDENT', 'BUG', 'REQUEST']).default('QUESTION'),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    channel: z.enum(['PHONE', 'WHATSAPP', 'WEB']).default('PHONE'),
    /** Usuario del tenant que pidió ayuda, si se sabe. */
    requesterUserId: z.string().uuid().nullable().optional(),
    /** Nombre de quien pidió ayuda cuando no es un usuario identificado. */
    requesterName: z.string().trim().max(SUPPORT_LIMITS.REQUESTER_NAME_MAX_LENGTH).optional(),
    attachmentIds,
});

export type CreateTicketOnBehalfInput = z.infer<typeof createTicketOnBehalfSchema>;

/** Respuesta pública del operador (la ve el cliente). */
export const replyTicketSchema = z.object({
    body,
    /** Si además deja el ticket esperando al cliente. */
    markPending: z.boolean().default(false),
    attachmentIds,
});

export type ReplyTicketInput = z.infer<typeof replyTicketSchema>;

/** Nota interna: NO la ve el cliente. */
export const addInternalNoteSchema = z.object({ body, attachmentIds });

export type AddInternalNoteInput = z.infer<typeof addInternalNoteSchema>;

/** Asignación; null deja el ticket sin dueño. */
export const assignTicketSchema = z.object({
    assigneeId: z.string().uuid().nullable(),
});

export type AssignTicketInput = z.infer<typeof assignTicketSchema>;

/**
 * Cambio de estado desde el backoffice.
 *
 * NEW no se pone a mano: es el estado con el que nace.
 */
export const changeTicketStatusSchema = z.object({
    status: z.enum(['OPEN', 'PENDING', 'ON_HOLD', 'SOLVED', 'CLOSED']),
});

export type ChangeTicketStatusInput = z.infer<typeof changeTicketStatusSchema>;

export const changeTicketPrioritySchema = z.object({
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
});

export type ChangeTicketPriorityInput = z.infer<typeof changeTicketPrioritySchema>;

// ── Tenant ──

/** Alta desde la app del tenant. El canal es siempre WEB. */
export const createMyTicketSchema = z.object({
    subject,
    body,
    type: z.enum(['QUESTION', 'INCIDENT', 'BUG', 'REQUEST']).default('QUESTION'),
    attachmentIds,
});

export type CreateMyTicketInput = z.infer<typeof createMyTicketSchema>;

/** Respuesta del cliente en su hilo. */
export const replyMyTicketSchema = z.object({ body, attachmentIds });

export type ReplyMyTicketInput = z.infer<typeof replyMyTicketSchema>;

/** CSAT: el cliente califica del 1 al 5, con comentario opcional. */
export const rateMyTicketSchema = z.object({
    rating: z.coerce
        .number()
        .int('La calificación debe ser un número entero')
        .min(1, 'La calificación va del 1 al 5')
        .max(5, 'La calificación va del 1 al 5'),
    comment: z.string().trim().max(1000).optional(),
});

export type RateMyTicketInput = z.infer<typeof rateMyTicketSchema>;

/** Filtros de "mis tickets". */
export const listMyTicketsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    /** Por defecto se ocultan los cerrados: son ruido. */
    includeClosed: z.coerce.boolean().default(false),
});

export type ListMyTicketsInput = z.infer<typeof listMyTicketsSchema>;

/** El tenant navega por folio (/soporte/SUP-2026-1), no por UUID. */
export const ticketNumberParamSchema = z.object({
    number: z.string().trim().min(1).max(30),
});

export type TicketNumberParam = z.infer<typeof ticketNumberParamSchema>;

// ── Respuestas guardadas (F4) ──

const cannedTitle = z
    .string()
    .trim()
    .min(3, 'Ponle un nombre para reconocerla')
    .max(120);

const cannedBody = z
    .string()
    .trim()
    .min(1, 'La plantilla no puede ir vacía')
    .max(5000);

/**
 * Alta/edición de una plantilla de respuesta.
 *
 * El cuerpo puede llevar variables `{{tenantName}}`, `{{requesterName}}`,
 * `{{ticketNumber}}`, `{{operatorName}}`, que se sustituyen al insertarla. El
 * operador SIEMPRE revisa el texto antes de enviar, así que una variable que no
 * exista se queda tal cual, sin romper nada.
 */
export const cannedResponseInputSchema = z.object({
    title: cannedTitle,
    body: cannedBody,
});

export type CannedResponseInput = z.infer<typeof cannedResponseInputSchema>;

export const cannedResponseIdParamSchema = z.object({
    id: z.string().uuid('El ID de la plantilla debe ser un UUID válido'),
});

export type CannedResponseIdParam = z.infer<typeof cannedResponseIdParamSchema>;
