/**
 * @fileoverview Schemas Zod para validacion HTTP del modulo PosTicket
 * @module infrastructure/api/schemas
 * @version 1.0.0
 */

import { z } from 'zod';
import { POS_TICKET_CONSTANTS } from '../constants';


const { LIMITS } = POS_TICKET_CONSTANTS;

// ============================================================
// PARAMS
// ============================================================

/** Validacion de parametro :id en la URL. */
export const ticketIdParamSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID valido'),
});

// ============================================================
// COMMANDS
// ============================================================

/** POST /api/pos-tickets — Crear ticket. */
export const createPosTicketSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string().min(1).max(50),
  posSessionId: z.string().uuid(),
  locationId: z.string().uuid(),
  customerId: z.string().uuid().nullable().optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(500).nullable().optional(),
  deviceId: z.string().optional(),
});

/** POST /api/pos-tickets/:id/lines — Agregar linea. */
export const addLineSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1).max(200),
  productSku: z.string().max(50).nullable().optional(),
  quantity: z.number().min(LIMITS.MIN_QUANTITY).max(LIMITS.MAX_QUANTITY),
  unitPrice: z.number().min(0).max(LIMITS.MAX_UNIT_PRICE),
  discountPercent: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(1).optional(),
  notes: z.string().max(200).nullable().optional(),
  version: z.number().int().min(0),
});

/** PUT /api/pos-tickets/:id/lines/:lineId — Actualizar cantidad. */
export const updateLineQuantitySchema = z.object({
  quantity: z.number().min(LIMITS.MIN_QUANTITY).max(LIMITS.MAX_QUANTITY),
  version: z.number().int().min(0),
});

/** DELETE /api/pos-tickets/:id/lines/:lineId — Eliminar linea. */
export const removeLineSchema = z.object({
  version: z.coerce.number().int().min(0),
});

/** POST /api/pos-tickets/:id/payments — Agregar pago. */
export const addPaymentSchema = z.object({
  paymentMethodId: z.string().uuid(),
  paymentMethodName: z.string().min(1).max(100),
  paymentMethodType: z.enum(['CASH', 'CARD', 'TRANSFER', 'CREDIT', 'OTHER']),
  amountPaid: z.number().min(0.01),
  currency: z.string().length(3).optional(),
  reference: z.string().max(200).nullable().optional(),
  version: z.number().int().min(0),
});

/** POST /api/pos-tickets/:id/complete — Completar ticket. */
export const completePosTicketSchema = z.object({
  version: z.number().int().min(0),
});

/** POST /api/pos-tickets/:id/cancel — Cancelar ticket. */
export const cancelPosTicketSchema = z.object({
  reason: z.string().min(1).max(500),
  version: z.number().int().min(0),
});

/** POST /api/pos-tickets/:id/void — Anular ticket. */
export const voidPosTicketSchema = z.object({
  reason: z.string().min(1).max(500),
  version: z.number().int().min(0),
});

// ============================================================
// QUERIES
// ============================================================

const posTicketStatusEnum = z.enum(['OPEN', 'COMPLETED', 'VOIDED', 'CANCELLED']);
const posTicketSortFieldEnum = z.enum(['createdAt', 'totalAmount', 'ticketNumber', 'status']);
const sortDirectionEnum = z.enum(['asc', 'desc']);

/** GET /api/pos-tickets — Listar tickets. */
export const getPosTicketsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: posTicketStatusEnum.optional(),
  posSessionId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  ticketNumber: z.string().max(50).optional(),
  minTotal: z.coerce.number().min(0).optional(),
  maxTotal: z.coerce.number().min(0).optional(),
  sortBy: posTicketSortFieldEnum.optional(),
  sortOrder: sortDirectionEnum.optional(),
});

/** GET /api/pos-tickets/session/:sessionId — Tickets por sesion. */
export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid('El sessionId debe ser un UUID valido'),
});

/** GET /api/pos-tickets/daily-summary — Resumen diario. */
export const dailySummarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha YYYY-MM-DD'),
  locationId: z.string().uuid().optional(),
});

/** Parametros de linea :lineId. */
export const lineIdParamSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID valido'),
  lineId: z.string().uuid('El lineId debe ser un UUID valido'),
});
