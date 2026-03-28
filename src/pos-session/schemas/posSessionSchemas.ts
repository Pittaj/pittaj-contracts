/**
 * @fileoverview Schemas Zod para validación de rutas PosSession
 * @module PosSessionSchemas
 * @version 1.0.0
 */

import { z } from 'zod';
import { POS_SESSION_CONSTANTS } from '../constants';


const { LIMITS, STATUSES, CASH_MOVEMENT_TYPES, CASH_MOVEMENT_REASONS, CURRENCIES } =
    POS_SESSION_CONSTANTS;

// ── Enums ────────────────────────────────────────────────
const posSessionStatusEnum = z.enum(STATUSES as unknown as [string, ...string[]]);
const cashMovementTypeEnum = z.enum(CASH_MOVEMENT_TYPES as unknown as [string, ...string[]]);
const cashMovementReasonEnum = z.enum(CASH_MOVEMENT_REASONS as unknown as [string, ...string[]]);
const currencyEnum = z.enum(CURRENCIES as unknown as [string, ...string[]]);

// ── Sub-schemas ──────────────────────────────────────────
const closingBalanceSchema = z.object({
    expectedAmount: z.number().min(0),
    actualAmount: z.number().min(0),
    difference: z.number(),
    currency: currencyEnum,
});

const sessionSummarySchema = z.object({
    totalSales: z.number().min(0),
    totalRefunds: z.number().min(0),
    totalCashIn: z.number().min(0),
    totalCashOut: z.number().min(0),
    netCash: z.number(),
    transactionCount: z.number().int().min(0),
    refundCount: z.number().int().min(0),
    averageTicket: z.number().min(0),
    currency: currencyEnum,
});

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

// ── Params ───────────────────────────────────────────────
export const posSessionIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

// ── Commands ─────────────────────────────────────────────
export const openPosSessionSchema = z.object({
    id: z.string().uuid(),
    locationId: z.string().uuid(),
    openingBalanceAmount: z.number()
        .min(LIMITS.MIN_OPENING_BALANCE)
        .max(LIMITS.MAX_OPENING_BALANCE),
    currency: currencyEnum.optional(),
});

export const versionBodySchema = z.object({
    version: z.number().int().min(1),
});

export const closePosSessionSchema = z.object({
    version: z.number().int().min(1),
    closingBalance: closingBalanceSchema,
    summary: sessionSummarySchema,
    cashClosureId: z.string().uuid(),
});

export const addCashMovementSchema = z.object({
    version: z.number().int().min(1),
    type: cashMovementTypeEnum,
    reason: cashMovementReasonEnum,
    amount: z.number().positive(),
    description: z.string().max(LIMITS.MAX_MOVEMENT_DESCRIPTION).nullable().optional(),
});

export const updateNotesSchema = z.object({
    version: z.number().int().min(1),
    notes: z.string().max(LIMITS.MAX_NOTES).nullable(),
});

// ── Queries ──────────────────────────────────────────────
export const getPosSessionsSchema = z.object({
    status: posSessionStatusEnum.optional(),
    locationId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const getActiveSessionSchema = z.object({
    locationId: z.string().uuid(),
});

export const getOpenByLocationSchema = z.object({
    locationId: z.string().uuid(),
});

export const getDailyStatsSchema = z.object({
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
});

// ── Sync ─────────────────────────────────────────────────
export const syncPushPosSessionSchema = z.object({
    tenantId: z.string().uuid(),
    deviceId: z.string().min(1),
    changes: z.array(syncChangeSchema).min(1),
});

export const syncPullPosSessionsSchema = z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
});
