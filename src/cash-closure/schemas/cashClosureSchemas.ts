/**
 * @fileoverview Schemas Zod para validación HTTP del módulo CashClosure
 * @module infrastructure/api/schemas
 * @version 1.0.0
 */

import { z } from 'zod';
import { CASH_CLOSURE_CONSTANTS } from '../constants';


const { LIMITS, STATUSES, SHIFTS, CURRENCIES } = CASH_CLOSURE_CONSTANTS;

// ============================================================
// SUB-SCHEMAS
// ============================================================

/** Resumen de pago por método */
const paymentSummarySchema = z.object({
    paymentMethodId: z.string().uuid(),
    paymentMethodName: z.string().min(1),
    isCashCount: z.boolean().default(false),
    expectedAmount: z.object({
        amount: z.number().min(0),
        currency: z.enum(CURRENCIES as unknown as [string, ...string[]]),
    }),
    actualAmount: z.object({
        amount: z.number().min(0),
        currency: z.enum(CURRENCIES as unknown as [string, ...string[]]),
    }),
    transactionCount: z.number().int().min(0),
});

/** Schema para cambios de sincronización */
const syncChangeSchema = z.object({
    id: z.string().uuid(),
    entityType: z.string().min(1),
    operation: z.enum(['create', 'update', 'delete', 'upsert']),
    data: z.record(z.unknown()).optional(),
    version: z.number().int(),
    localTimestamp: z.coerce.date(),
    deviceId: z.string().optional(),
    tenantId: z.string().uuid(),
});

// ============================================================
// ENUMS
// ============================================================

const cashClosureStatusEnum = z.enum(STATUSES as unknown as [string, ...string[]]);
const cashClosureShiftEnum = z.enum(SHIFTS as unknown as [string, ...string[]]);
const currencyEnum = z.enum(CURRENCIES as unknown as [string, ...string[]]);

// ============================================================
// PARAMS
// ============================================================

/** Validación de parámetro :id en la URL */
export const cashClosureIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

// ============================================================
// COMMANDS
// ============================================================

/** POST /api/cash-closures — Crear cierre de caja */
export const createCashClosureSchema = z.object({
    id: z.string().uuid(),
    shift: cashClosureShiftEnum,
    openedAt: z.coerce.date(),
    closedAt: z.coerce.date(),
    posSessionId: z.string().uuid(),
    locationId: z.string().uuid(),
    openingFundAmount: z.number().min(LIMITS.MIN_OPENING_FUND).max(LIMITS.MAX_OPENING_FUND),
    currency: currencyEnum.optional(),
});

/** PUT /api/cash-closures/:id — Actualizar cierre de caja */
export const updateCashClosureSchema = z.object({
    version: z.number().int().min(1),
    openingFundAmount: z.number().min(LIMITS.MIN_OPENING_FUND).max(LIMITS.MAX_OPENING_FUND).optional(),
    currency: currencyEnum.optional(),
    paymentSummaries: z.array(paymentSummarySchema).max(LIMITS.MAX_PAYMENT_SUMMARIES).optional(),
    notes: z.string().max(LIMITS.MAX_NOTES_LENGTH).nullable().optional(),
});

/** POST /api/cash-closures/:id/submit — Version en body */
export const versionBodySchema = z.object({
    version: z.number().int().min(1),
});

/** POST /api/cash-closures/:id/reject — Rechazar con razón */
export const rejectCashClosureSchema = z.object({
    version: z.number().int().min(1),
    reason: z.string().min(1).max(LIMITS.MAX_REJECTION_REASON_LENGTH),
});

// ============================================================
// QUERIES
// ============================================================

/** GET /api/cash-closures — Listar con filtros */
export const getCashClosuresSchema = z.object({
    status: cashClosureStatusEnum.optional(),
    locationId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).optional(),
});

/** GET /api/cash-closures/daily-summary — Resumen diario */
export const getDailySummarySchema = z.object({
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
});

/** GET /api/cash-closures/payment-method-summary — Resumen por método de pago */
export const getPaymentMethodSummarySchema = z.object({
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
});

// ============================================================
// SYNC
// ============================================================

/** POST /api/cash-closures/sync/push */
export const syncPushCashClosureSchema = z.object({
    tenantId: z.string().uuid(),
    deviceId: z.string().min(1),
    changes: z.array(syncChangeSchema).min(1),
});

/** POST /api/cash-closures/sync/pull */
export const syncPullCashClosureSchema = z.object({
    tenantId: z.string().uuid(),
    lastSyncedAt: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).optional(),
});
