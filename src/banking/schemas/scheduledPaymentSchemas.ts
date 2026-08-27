/**
 * @fileoverview Schemas Zod de la programación de pagos (Bancos N4).
 * @module banking/schemas/scheduledPayment
 *
 * En archivo aparte de `bankingSchemas.ts` a propósito: ese ya pasa de 400
 * líneas y lo tocan varias ramas a la vez. Un archivo nuevo por nivel evita
 * el conflicto de merge que el feed viene a prevenir.
 */

import { z } from 'zod';
import { BANKING_CONSTANTS } from '../constants/index.js';

const { LIMITS, SCHEDULED_PAYMENT_LIMITS: SCHED } = BANKING_CONSTANTS;

const directionEnum = z.enum(BANKING_CONSTANTS.DIRECTIONS);
const scheduledSourceTypeEnum = z.enum(BANKING_CONSTANTS.SCHEDULED_PAYMENT_SOURCE_TYPES);
const scheduledStateEnum = z.enum(BANKING_CONSTANTS.SCHEDULED_PAYMENT_STATES);

/** Fecha en formato ISO (YYYY-MM-DD). */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato YYYY-MM-DD');

/** Documento origen de la obligación. */
const scheduledSourceSchema = z.object({
  type: scheduledSourceTypeEnum,
  id: z.string().uuid().nullish(),
});

/**
 * POST /api/scheduled-payments — alta.
 *
 * `accrualDate` es opcional y, si no viene, el dominio la iguala a `dueDate`.
 * La mayoría de los gastos del día a día devengan cuando se pagan, y pedir las
 * dos siempre convertiría el caso común en trabajo extra.
 */
export const createScheduledPaymentSchema = z.object({
  /** Id generado en origen (sync-ready). Opcional: el servidor lo crea si falta. */
  id: z.string().uuid().optional(),
  direction: directionEnum.default('OUT'),
  categoryId: z.string().uuid('La categoría debe ser un UUID válido'),
  bankAccountId: z.string().uuid().nullish(),
  dueDate: isoDateSchema,
  accrualDate: isoDateSchema.optional(),
  amount: z.number().positive('El importe debe ser mayor que cero').max(LIMITS.MAX_AMOUNT),
  currency: z.string().length(3).default('MXN'),
  description: z.string().trim().min(1).max(SCHED.MAX_DESCRIPTION_LENGTH),
  source: scheduledSourceSchema.optional(),
  templateId: z.string().uuid().nullish(),
});

/**
 * PUT /api/scheduled-payments/:id — edición.
 *
 * `version` es **obligatoria**: es el control optimista y no admite omisión.
 * Sin ella, dos ediciones concurrentes se resuelven por «gana el último», que
 * en un importe es el error que no se descubre hasta que el dinero no alcanza.
 */
export const updateScheduledPaymentSchema = z.object({
  categoryId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().nullish(),
  dueDate: isoDateSchema.optional(),
  accrualDate: isoDateSchema.optional(),
  amount: z.number().positive().max(LIMITS.MAX_AMOUNT).optional(),
  description: z.string().trim().min(1).max(SCHED.MAX_DESCRIPTION_LENGTH).optional(),
  version: z.number().int().min(1),
});

/**
 * POST /api/scheduled-payments/:id/settle — liquidar.
 *
 * Registra el movimiento de tesorería y lo ata a la obligación en la misma
 * transacción. La cuenta es obligatoria aquí aunque sea opcional al programar:
 * el dinero sale de algún lado, y ese «algún lado» se sabe al pagar.
 */
export const settleScheduledPaymentSchema = z.object({
  bankAccountId: z.string().uuid('La cuenta debe ser un UUID válido'),
  /** Fecha valor del movimiento. Por omisión, hoy. */
  paidOn: isoDateSchema.optional(),
  /**
   * Importe realmente pagado. Por omisión, el de la obligación.
   *
   * Se admite distinto porque el recibo de la luz nunca trae lo que se estimó,
   * y obligar a editar la obligación antes de pagarla sería pedirle al usuario
   * que corrija el pasado para poder registrar el presente.
   */
  amount: z.number().positive().max(LIMITS.MAX_AMOUNT).optional(),
  reference: z.string().trim().max(LIMITS.MAX_REFERENCE_LENGTH).nullish(),
  notes: z.string().trim().max(LIMITS.MAX_NOTES_LENGTH).nullish(),
  version: z.number().int().min(1),
});

/** POST /api/scheduled-payments/:id/cancel — cancelar. */
export const cancelScheduledPaymentSchema = z.object({
  version: z.number().int().min(1),
});

/** GET /api/scheduled-payments — listado plano (vista lista del calendario). */
export const getScheduledPaymentsSchema = z.object({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  categoryId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  state: scheduledStateEnum.optional(),
  /** true = incluir canceladas; por omisión no se muestran. */
  includeCancelled: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).optional(),
});

/** GET /api/cash-planning/calendar — el mes, agrupado por día. */
export const getPaymentCalendarSchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
  categoryId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  /** true = pintar también las ya pagadas (por omisión, sí: el mes debe cuadrar). */
  includeSettled: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'),
});

/** GET /api/cash-planning/projection — saldo proyectado. */
export const getCashProjectionSchema = z.object({
  days: z.coerce
    .number()
    .int()
    .min(1)
    .max(SCHED.MAX_PROJECTION_DAYS)
    .optional()
    .default(SCHED.DEFAULT_PROJECTION_DAYS),
  bankAccountId: z.string().uuid().optional(),
});

export type CreateScheduledPaymentInput = z.infer<typeof createScheduledPaymentSchema>;
export type UpdateScheduledPaymentInput = z.infer<typeof updateScheduledPaymentSchema>;
export type SettleScheduledPaymentInput = z.infer<typeof settleScheduledPaymentSchema>;
export type CancelScheduledPaymentInput = z.infer<typeof cancelScheduledPaymentSchema>;
export type GetScheduledPaymentsInput = z.infer<typeof getScheduledPaymentsSchema>;
export type GetPaymentCalendarInput = z.infer<typeof getPaymentCalendarSchema>;
export type GetCashProjectionInput = z.infer<typeof getCashProjectionSchema>;
