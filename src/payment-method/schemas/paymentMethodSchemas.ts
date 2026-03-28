/**
 * @fileoverview Schemas Zod para validación HTTP del módulo PaymentMethod
 * @module infrastructure/api/schemas
 * @version 1.0.0
 */

import { z } from 'zod';
import { PAYMENT_METHOD_CONSTANTS } from '../constants';


const { LIMITS, TYPES, STATUSES } = PAYMENT_METHOD_CONSTANTS;

// ============================================================
// SUB-SCHEMAS
// ============================================================

/** Configuración del método de pago (comisiones, referencias, etc.) */
const paymentMethodConfigSchema = z.object({
    isCashCount: z.boolean().default(false),
    requiresCustomer: z.boolean().default(false),
    requiresReference: z.boolean().default(false),
    commission: z.number().min(0).max(LIMITS.MAX_COMMISSION_PERCENT).default(0),
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

const paymentMethodTypeEnum = z.enum(TYPES as unknown as [string, ...string[]]);
const paymentMethodStatusEnum = z.enum(STATUSES as unknown as [string, ...string[]]);

// ============================================================
// PARAMS
// ============================================================

/** Validación de parámetro :id en la URL */
export const paymentMethodIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

// ============================================================
// COMMANDS
// ============================================================

/** POST /api/payment-methods — Crear método de pago */
export const createPaymentMethodSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH),
    type: paymentMethodTypeEnum,
    displayOrder: z.number().int().min(LIMITS.MIN_DISPLAY_ORDER).max(LIMITS.MAX_DISPLAY_ORDER).optional(),
    config: paymentMethodConfigSchema.optional(),
    deviceId: z.string().optional(),
});

/** POST /api/payment-methods/defaults — Crear métodos por defecto */
export const createDefaultsSchema = z.object({
    deviceId: z.string().optional(),
});

/** PUT /api/payment-methods/:id — Actualizar método de pago */
export const updatePaymentMethodSchema = z.object({
    version: z.number().int().min(1),
    name: z.string().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH).optional(),
    displayOrder: z.number().int().min(LIMITS.MIN_DISPLAY_ORDER).max(LIMITS.MAX_DISPLAY_ORDER).optional(),
    config: paymentMethodConfigSchema.optional(),
});

/** DELETE /api/payment-methods/:id (query params) */
export const deletePaymentMethodSchema = z.object({
    version: z.coerce.number().int().min(1),
});

/** POST /api/payment-methods/:id/activate | deactivate — Version en body */
export const versionBodySchema = z.object({
    version: z.number().int().min(1),
});

// ============================================================
// QUERIES
// ============================================================

/** GET /api/payment-methods — Listar con filtros */
export const getPaymentMethodsSchema = z.object({
    q: z.string().max(100).optional(),
    type: paymentMethodTypeEnum.optional(),
    status: paymentMethodStatusEnum.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).optional(),
});

// ============================================================
// SYNC
// ============================================================

/** POST /api/payment-methods/sync/push */
export const syncPushPaymentMethodSchema = z.object({
    tenantId: z.string().uuid(),
    deviceId: z.string().min(1),
    changes: z.array(syncChangeSchema).min(1),
});

/** POST /api/payment-methods/sync/pull */
export const syncPullPaymentMethodSchema = z.object({
    tenantId: z.string().uuid(),
    lastSyncedAt: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).optional(),
});
