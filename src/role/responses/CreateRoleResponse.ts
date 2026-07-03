/**
 * @fileoverview DTO de respuesta después de crear un rol.
 *
 * El backend solo devuelve el ID del rol creado (el cliente ya conoce
 * el resto porque lo envió, y el id lo genera el cliente offline-first).
 * Para obtener el rol completo usar GET /roles/:id.
 *
 * @module Contracts/Role/DTOs
 * @version 2.0.0
 */

/**
 * DTO de respuesta después de POST /roles.
 *
 * @example
 * ```typescript
 * const created: CreateRoleResponse = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 * };
 * ```
 */
export interface CreateRoleResponse {
  /**
   * ID único del rol creado (UUID v4).
   */
  readonly id: string;
}
