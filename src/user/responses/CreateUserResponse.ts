/**
 * @fileoverview DTO de respuesta después de crear un usuario.
 *
 * Define la estructura de datos que el backend devuelve
 * después de crear exitosamente un usuario (POST /users).
 *
 * El backend solo devuelve el ID del usuario creado (el cliente ya
 * conoce el resto de los datos porque los envió, y el id lo genera
 * el cliente de forma offline-first). Para obtener el usuario
 * completo usar GET /users/:id.
 *
 * @module Contracts/User/DTOs
 * @version 2.0.0
 * @since 11-11-2025
 */

/**
 * DTO de respuesta después de POST /users.
 *
 * @example
 * ```typescript
 * const created: CreateUserResponse = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 * };
 * ```
 */
export interface CreateUserResponse {
  /**
   * ID único del usuario creado (UUID v4).
   */
  readonly id: string;
}
