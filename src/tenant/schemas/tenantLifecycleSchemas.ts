/**
 * @fileoverview Schemas Zod para validación HTTP del módulo Tenant (lifecycle)
 * @module Tenant/Infrastructure/API/Schemas
 * @version 1.0.0
 */

import { z } from 'zod';

// ─── PARAMS ───────────────────────────────────────────────

/** Validación de parámetro :tenantId en la URL. */
export const tenantIdParamSchema = z.object({
    tenantId: z.string().uuid('El ID del tenant debe ser un UUID válido'),
});

// ─── COMMANDS ─────────────────────────────────────────────

/** POST /api/tenants/:tenantId/request-deletion */
export const requestTenantDeletionSchema = z.object({
    gracePeriodDays: z.number().int().min(1).max(90).optional(),
});

/** POST /api/tenants/:tenantId/force-delete */
export const forceDeleteTenantSchema = z.object({
    reason: z.string().max(500).optional(),
});
