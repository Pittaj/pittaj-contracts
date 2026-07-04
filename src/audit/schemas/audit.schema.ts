/**
 * @fileoverview Zod schemas para la auditoría del tenant (Organización).
 *
 * Dos fuentes:
 * - Bitácora de Actividad: tabla audit_logs (mutaciones registradas por
 *   el middleware de auditoría del API, tenant-scoped)
 * - Registro de Accesos: tabla auth_login_attempts (intentos de login,
 *   filtrados a las identidades del tenant)
 *
 * @module Contracts/Audit
 */

import { z } from 'zod';

const pagination = {
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
};

/** Query params de GET /audit-logs. */
export const getAuditLogsSchema = z.object({
    ...pagination,
    /** Filtrar por acción (CREATE/UPDATE/DELETE u otra registrada). */
    action: z.string().trim().max(50).optional(),
    /** Filtrar por tipo de entidad (taxes, roles, users, ...). */
    entityType: z.string().trim().max(50).optional(),
});

export type GetAuditLogsQuery = z.infer<typeof getAuditLogsSchema>;

/** Query params de GET /access-logs. */
export const getAccessLogsSchema = z.object({
    ...pagination,
    /** Filtrar por resultado del intento. */
    result: z.enum(['success', 'failure']).optional(),
    /** Búsqueda por email (contiene). */
    search: z.string().trim().max(255).optional(),
});

export type GetAccessLogsQuery = z.infer<typeof getAccessLogsSchema>;
