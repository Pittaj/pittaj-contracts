/**
 * @fileoverview DTO de respuesta después de crear un rol.
 * 
 * Define la estructura de datos que el backend devuelve
 * después de crear exitosamente un rol (POST /roles).
 * 
 * @module Contracts/Role/DTOs
 * @version 1.0.0
 * @since 11-11-2025
 */

/**
 * DTO de respuesta después de POST /roles.
 * 
 * Contiene los datos esenciales del rol recién creado.
 * 
 * @example
 * ```typescript
 * const createdRole: CreateRoleResponse = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   name: 'Gerente',
 *   description: 'Gerente de tienda',
 *   isActive: true,
 *   createdAt: '2025-11-11T10:00:00Z',
 *   version: 1,
 * };
 * ```
 */
export interface CreateRoleResponse {
  /**
   * ID único del rol (UUID v4).
   */
  readonly id: string;

  /**
   * Nombre del rol (único por tenant).
   */
  readonly name: string;

  /**
   * Descripción del rol (opcional).
   */
  readonly description?: string;

  /**
   * Indica si el rol está activo.
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
