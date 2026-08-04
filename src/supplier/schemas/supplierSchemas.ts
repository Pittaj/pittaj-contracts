/**
 * @fileoverview Schemas Zod para validación HTTP del módulo Supplier
 * @module Contracts/Supplier/Schemas
 * @version 1.0.0
 *
 * Espejo estructural de customerSchemas: mismas convenciones (id generado por
 * el cliente, version en las mutaciones para OCC, sync derivado del canónico
 * de src/sync). Reglas de dominio del desktop: name y code obligatorios,
 * creditDays >= 0 (0 = contado).
 */

import { z } from 'zod';
import { SUPPLIER_CONSTANTS } from '../constants/index.js';
import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync/index.js';

const { LIMITS, STATUSES } = SUPPLIER_CONSTANTS;

// ============================================================
// SUB-SCHEMAS
// ============================================================

/** Dirección del proveedor (misma forma que la de cliente). */
const supplierAddressSchema = z.object({
    street: z.string().min(1).max(LIMITS.MAX_ADDRESS_LINE_LENGTH),
    street2: z.string().max(LIMITS.MAX_ADDRESS_LINE_LENGTH).nullable().default(null),
    city: z.string().min(1).max(LIMITS.MAX_ADDRESS_LINE_LENGTH),
    state: z.string().min(1).max(LIMITS.MAX_ADDRESS_LINE_LENGTH),
    postalCode: z.string().min(1).max(LIMITS.MAX_POSTAL_CODE_LENGTH),
    country: z.string().min(1).max(LIMITS.MAX_ADDRESS_LINE_LENGTH),
});

// ============================================================
// ENUMS
// ============================================================

const supplierStatusEnum = z.enum(STATUSES);

// ============================================================
// PARAMS
// ============================================================

/** Validación de parámetro :id en la URL */
export const supplierIdParamSchema = z.object({
    id: z.string().uuid('El ID del proveedor debe ser un UUID válido'),
});

// ============================================================
// COMMANDS
// ============================================================

/** POST /api/suppliers — Crear proveedor */
export const createSupplierSchema = z.object({
    /** UUID generado por el cliente (offline-first). */
    id: z.string().uuid(),
    name: z.string().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH),
    code: z.string().min(1).max(LIMITS.MAX_CODE_LENGTH),
    taxId: z.string().min(LIMITS.MIN_TAX_ID_LENGTH).max(LIMITS.MAX_TAX_ID_LENGTH).nullable().optional(),
    regimenFiscal: z.string().max(LIMITS.MAX_REGIMEN_FISCAL_LENGTH).nullable().optional(),
    email: z.string().email().max(LIMITS.MAX_EMAIL_LENGTH).nullable().optional(),
    phone: z.string().min(LIMITS.MIN_PHONE_LENGTH).max(LIMITS.MAX_PHONE_LENGTH).nullable().optional(),
    address: supplierAddressSchema.nullable().optional(),
    /** Días de crédito (condiciones de pago). 0 = contado. */
    creditDays: z.number().int().min(LIMITS.MIN_CREDIT_DAYS).max(LIMITS.MAX_CREDIT_DAYS).optional(),
    /** Moneda de compra por defecto (ej. "MXN"). */
    currency: z.string().max(LIMITS.MAX_CURRENCY_LENGTH).nullable().optional(),
});

/** PUT /api/suppliers/:id — Actualizar proveedor */
export const updateSupplierSchema = z.object({
    version: z.number().int().min(1),
    name: z.string().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH).optional(),
    taxId: z.string().min(LIMITS.MIN_TAX_ID_LENGTH).max(LIMITS.MAX_TAX_ID_LENGTH).nullable().optional(),
    regimenFiscal: z.string().max(LIMITS.MAX_REGIMEN_FISCAL_LENGTH).nullable().optional(),
    email: z.string().email().max(LIMITS.MAX_EMAIL_LENGTH).nullable().optional(),
    phone: z.string().min(LIMITS.MIN_PHONE_LENGTH).max(LIMITS.MAX_PHONE_LENGTH).nullable().optional(),
    address: supplierAddressSchema.nullable().optional(),
    creditDays: z.number().int().min(LIMITS.MIN_CREDIT_DAYS).max(LIMITS.MAX_CREDIT_DAYS).optional(),
    currency: z.string().max(LIMITS.MAX_CURRENCY_LENGTH).nullable().optional(),
});

/** DELETE /api/suppliers/:id (query params) */
export const deleteSupplierSchema = z.object({
    version: z.coerce.number().int().min(1),
});

/** POST /api/suppliers/:id/activate | deactivate — Version en body */
export const supplierVersionBodySchema = z.object({
    version: z.number().int().min(1),
});

// ============================================================
// QUERIES
// ============================================================

/** GET /api/suppliers — Listar con filtros y paginación offset */
export const getSuppliersSchema = z.object({
    /** Búsqueda case-insensitive por nombre, código, email, teléfono o RFC. */
    search: z.string().max(100).optional(),
    status: supplierStatusEnum.optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).optional(),
});

// ============================================================
// SYNC
// ============================================================

/** POST /api/suppliers/sync/push — deriva del canónico src/sync */
export const syncPushSupplierSchema = syncPushRequestSchema;

/** POST /api/suppliers/sync/pull — deriva del canónico src/sync */
export const syncPullSupplierSchema = syncPullRequestSchema;

// ============================================================
// Tipos inferidos
// ============================================================

export type SupplierIdParam = z.infer<typeof supplierIdParamSchema>;
export type CreateSupplierRequest = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierRequest = z.infer<typeof updateSupplierSchema>;
export type GetSuppliersQueryParams = z.infer<typeof getSuppliersSchema>;
