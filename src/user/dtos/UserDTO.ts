/**
 * @fileoverview DTO de respuesta para User (GET endpoints).
 * 
 * Define la estructura de datos que el backend envía al frontend
 * cuando se consulta información de usuarios.
 * 
 * @module Contracts/User/DTOs
 * @version 1.0.0
 * @since 11-11-2025
 */

/**
 * DTO de respuesta para consultas de usuarios.
 * 
 * Usado en:
 * - GET /users (lista)
 * - GET /users/:id (detalle)
 * - PUT /users/:id (respuesta después de update)
 * 
 * @example
 * ```typescript
 * const user: UserDTO = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   firstName: 'Juan',
 *   lastName: 'Pérez',
 *   email: 'juan.perez@pittaj.com',
 *   phone: '+593987654321',
 *   avatarUrl: 'https://...',
 *   isActive: true,
 *   createdAt: '2025-11-11T10:00:00Z',
 *   updatedAt: '2025-11-11T10:00:00Z',
 * };
 * ```
 */
export interface UserDTO {
  /**
   * ID único del usuario (UUID v4).
   */
  readonly id: string;

  /**
   * Nombre del usuario.
   */
  readonly firstName: string;

  /**
   * Apellido del usuario.
   */
  readonly lastName: string;

  /**
   * Email del usuario (único por tenant).
   */
  readonly email: string;

  /**
   * Teléfono del usuario (opcional).
   */
  readonly phone?: string;

  /**
   * URL del avatar del usuario (opcional).
   */
  readonly avatarUrl?: string;

  /**
   * Indica si el usuario está activo.
   */
  readonly isActive: boolean;

  /**
   * Fecha de creación (ISO 8601).
   */
  readonly createdAt: string;

  /**
   * ID del usuario que creó este registro (UUID).
   */
  readonly createdBy?: string;

  /**
   * Fecha de última actualización (ISO 8601).
   */
  readonly updatedAt?: string;

  /**
   * ID del usuario que actualizó este registro (UUID).
   */
  readonly updatedBy?: string;

  /**
   * Versión para optimistic locking.
   */
  readonly version: number;
}
