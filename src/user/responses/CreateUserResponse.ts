/**
 * @fileoverview DTO de respuesta después de crear un usuario.
 * 
 * Define la estructura de datos que el backend devuelve
 * después de crear exitosamente un usuario (POST /users).
 * 
 * @module Contracts/User/DTOs
 * @version 1.0.0
 * @since 11-11-2025
 */

/**
 * DTO de respuesta después de POST /users.
 * 
 * Contiene los datos esenciales del usuario recién creado,
 * sin información sensible como password hash.
 * 
 * @example
 * ```typescript
 * const createdUser: CreateUserResponse = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   firstName: 'Juan',
 *   lastName: 'Pérez',
 *   email: 'juan.perez@pittaj.com',
 *   phone: '+593987654321',
 *   avatarUrl: 'https://...',
 *   isActive: true,
 *   createdAt: '2025-11-11T10:00:00Z',
 * };
 * ```
 */
export interface CreateUserResponse {
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
   * 
   * Por defecto es true al crear.
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
   * Versión para optimistic locking.
   * 
   * Siempre es 1 al crear.
   */
  readonly version: number;
}
