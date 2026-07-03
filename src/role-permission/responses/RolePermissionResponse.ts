/**
 * @fileoverview DTO de respuesta para asignaciones rol-permiso.
 *
 * Devuelto por GET /api/roles/:roleId/permissions (array plano, sin paginar).
 * Viene enriquecido con datos del catálogo de permisos.
 *
 * @module Contracts/RolePermission
 */

/** Asignación de un permiso a un rol, enriquecida con datos del permiso. */
export interface RolePermissionResponse {
  /** ID de la asignación (no del permiso). */
  readonly id: string;

  /** ID del rol. */
  readonly roleId: string;

  /** ID del permiso asignado. */
  readonly permissionId: string;

  /** Nombre legible del permiso (p.ej. "Ver usuarios"). */
  readonly permissionName: string;

  /** Código del permiso (p.ej. "org.users.view"). */
  readonly permissionCode: string;

  /** Alcance del permiso: MODULE | FEATURE | ACTION. */
  readonly permissionScope: string;

  /** Fecha de asignación (ISO 8601). */
  readonly createdAt?: string;

  /** ID del usuario que asignó. */
  readonly createdBy?: string;
}
