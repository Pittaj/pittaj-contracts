/**
 * @fileoverview DTO para UserRole (shared entre backend y frontend)
 * @module UserRoleDTO
 * @version 1.0.0
 */

/**
 * DTO de UserRole para transferencia de datos.
 * 
 * Usado tanto en backend (response) como en frontend (state).
 * 
 * @interface UserRoleDTO
 * @since 1.0.0
 */
export interface UserRoleDTO {
  /**
   * ID único de la asignación.
   */
  id: string;

  /**
   * ID del usuario.
   */
  userId: string;

  /**
   * ID del rol asignado.
   */
  roleId: string;

  /**
   * ID del tenant.
   */
  tenantId: string;

  /**
   * Fecha de creación.
   */
  createdAt: Date;

  /**
   * ID del usuario que creó la asignación.
   */
  createdBy: string | null;
}
