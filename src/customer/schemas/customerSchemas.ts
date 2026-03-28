/**
 * @fileoverview Schemas Zod para validación HTTP del módulo Customer
 * @module infrastructure/api/schemas
 * @version 1.0.0
 */

import { z } from 'zod';
import { CUSTOMER_CONSTANTS } from '../constants';


const { LIMITS, TYPES, STATUSES } = CUSTOMER_CONSTANTS;

// ============================================================
// SUB-SCHEMAS
// ============================================================

/** Configuración de crédito del cliente */
const customerCreditConfigSchema = z.object({
    creditEnabled: z.boolean().default(false),
    creditLimit: z.number().min(LIMITS.MIN_CREDIT_LIMIT).max(LIMITS.MAX_CREDIT_LIMIT).default(0),
    creditDays: z.number().int().min(LIMITS.MIN_CREDIT_DAYS).max(LIMITS.MAX_CREDIT_DAYS).default(0),
    creditUsed: z.number().min(0).default(0),
});

/** Dirección del cliente */
const customerAddressSchema = z.object({
    street: z.string().min(1).max(LIMITS.MAX_ADDRESS_LINE_LENGTH),
    street2: z.string().max(LIMITS.MAX_ADDRESS_LINE_LENGTH).nullable().default(null),
    city: z.string().min(1).max(LIMITS.MAX_ADDRESS_LINE_LENGTH),
    state: z.string().min(1).max(LIMITS.MAX_ADDRESS_LINE_LENGTH),
    postalCode: z.string().min(1).max(LIMITS.MAX_POSTAL_CODE_LENGTH),
    country: z.string().min(1).max(LIMITS.MAX_ADDRESS_LINE_LENGTH),
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

const customerTypeEnum = z.enum(TYPES as unknown as [string, ...string[]]);
const customerStatusEnum = z.enum(STATUSES as unknown as [string, ...string[]]);

// ============================================================
// PARAMS
// ============================================================

/** Validación de parámetro :id en la URL */
export const customerIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

// ============================================================
// COMMANDS
// ============================================================

/** POST /api/customers — Crear cliente */
export const createCustomerSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH),
    code: z.string().min(1).max(LIMITS.MAX_CODE_LENGTH),
    type: customerTypeEnum,
    email: z.string().email().max(LIMITS.MAX_EMAIL_LENGTH).nullable().optional(),
    phone: z.string().min(LIMITS.MIN_PHONE_LENGTH).max(LIMITS.MAX_PHONE_LENGTH).nullable().optional(),
    taxId: z.string().min(LIMITS.MIN_TAX_ID_LENGTH).max(LIMITS.MAX_TAX_ID_LENGTH).nullable().optional(),
    creditConfig: customerCreditConfigSchema.optional(),
    address: customerAddressSchema.nullable().optional(),
    notes: z.string().max(LIMITS.MAX_NOTES_LENGTH).nullable().optional(),
});

/** PUT /api/customers/:id — Actualizar cliente */
export const updateCustomerSchema = z.object({
    version: z.number().int().min(1),
    name: z.string().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH).optional(),
    email: z.string().email().max(LIMITS.MAX_EMAIL_LENGTH).nullable().optional(),
    phone: z.string().min(LIMITS.MIN_PHONE_LENGTH).max(LIMITS.MAX_PHONE_LENGTH).nullable().optional(),
    taxId: z.string().min(LIMITS.MIN_TAX_ID_LENGTH).max(LIMITS.MAX_TAX_ID_LENGTH).nullable().optional(),
    address: customerAddressSchema.nullable().optional(),
    creditConfig: customerCreditConfigSchema.optional(),
    notes: z.string().max(LIMITS.MAX_NOTES_LENGTH).nullable().optional(),
});

/** DELETE /api/customers/:id (query params) */
export const deleteCustomerSchema = z.object({
    version: z.coerce.number().int().min(1),
});

/** POST /api/customers/:id/activate | deactivate — Version en body */
export const versionBodySchema = z.object({
    version: z.number().int().min(1),
});

/** POST /api/customers/:id/block — Version + reason en body */
export const blockCustomerSchema = z.object({
    version: z.number().int().min(1),
    reason: z.string().max(LIMITS.MAX_NOTES_LENGTH).optional(),
});

/** POST /api/customers/:id/charge-credit — Cargo a crédito */
export const chargeCreditSchema = z.object({
    amount: z.number().positive(),
    referenceId: z.string().uuid(),
    version: z.number().int().min(1),
});

/** POST /api/customers/:id/credit-payment — Pago a crédito */
export const applyCreditPaymentSchema = z.object({
    amount: z.number().positive(),
    referenceId: z.string().uuid(),
    version: z.number().int().min(1),
});

// ============================================================
// QUERIES
// ============================================================

/** GET /api/customers — Listar con filtros y paginación offset */
export const getCustomersSchema = z.object({
    search: z.string().max(100).optional(),
    status: customerStatusEnum.optional(),
    type: customerTypeEnum.optional(),
    hasOutstandingDebt: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).optional(),
});

/** GET /api/customers/cursor — Listar con paginación cursor */
export const getCustomersCursorSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).optional(),
    search: z.string().max(100).optional(),
    status: customerStatusEnum.optional(),
    type: customerTypeEnum.optional(),
    hasOutstandingDebt: z.coerce.boolean().optional(),
});

/** GET /api/customers/search-pos — Búsqueda rápida para POS */
export const searchForPosSchema = z.object({
    query: z.string().min(1).max(100),
    limit: z.coerce.number().int().min(1).max(50).optional(),
});

// ============================================================
// SYNC
// ============================================================

/** POST /api/customers/sync/push */
export const syncPushCustomerSchema = z.object({
    tenantId: z.string().uuid(),
    deviceId: z.string().min(1),
    changes: z.array(syncChangeSchema).min(1),
});

/** POST /api/customers/sync/pull */
export const syncPullCustomerSchema = z.object({
    tenantId: z.string().uuid(),
    lastSyncedAt: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).optional(),
});
