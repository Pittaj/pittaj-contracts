/**
 * @fileoverview Schemas Zod para asignación de permisos a roles.
 *
 * Endpoints (montados bajo /api/roles):
 * - POST   /api/roles/:roleId/permissions              (body: { permissionId })
 * - DELETE /api/roles/:roleId/permissions/:permissionId
 * - GET    /api/roles/:roleId/permissions
 *
 * @module Contracts/RolePermission
 */

import { z } from 'zod';

/** Body de POST /api/roles/:roleId/permissions. */
export const assignPermissionToRoleSchema = z
  .object({
    permissionId: z.string().uuid('ID de permiso inválido'),
  })
  .strict();

export type AssignPermissionToRoleRequest = z.infer<typeof assignPermissionToRoleSchema>;

/** Path param de GET/POST /api/roles/:roleId/permissions. */
export const rolePermissionRoleIdParamSchema = z.object({
  roleId: z.string().uuid('ID de rol inválido'),
});

/** Path params de DELETE /api/roles/:roleId/permissions/:permissionId. */
export const revokePermissionParamSchema = z.object({
  roleId: z.string().uuid('ID de rol inválido'),
  permissionId: z.string().uuid('ID de permiso inválido'),
});
