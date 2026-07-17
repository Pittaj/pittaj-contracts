/**
 * @fileoverview Esquemas de entrada de Soporte.
 * @module Contracts/Support/Schemas
 */

import { z } from 'zod';
import { SUPPORT_LIMITS } from '../primitives';

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
});

export type CreateTicketOnBehalfInput = z.infer<typeof createTicketOnBehalfSchema>;

/** Respuesta pública del operador (la ve el cliente). */
export const replyTicketSchema = z.object({
    body,
    /** Si además deja el ticket esperando al cliente. */
    markPending: z.boolean().default(false),
});

export type ReplyTicketInput = z.infer<typeof replyTicketSchema>;

/** Nota interna: NO la ve el cliente. */
export const addInternalNoteSchema = z.object({ body });

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
});

export type CreateMyTicketInput = z.infer<typeof createMyTicketSchema>;

/** Respuesta del cliente en su hilo. */
export const replyMyTicketSchema = z.object({ body });

export type ReplyMyTicketInput = z.infer<typeof replyMyTicketSchema>;

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
