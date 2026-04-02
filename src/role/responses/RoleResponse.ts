/**
 * @fileoverview DTO de respuesta para Role (GET endpoints).
 * 
 * Define la estructura de datos que el backend envía al frontend
 * cuando se consulta información de roles.
 * 
 * @module Contracts/Role/DTOs
 * @version 1.0.0
 * @since 11-11-2025
 */

/**
 * DTO de respuesta para consultas de roles.
 * 
 * Usado en:
 * - GET /roles (lista)
 * - GET /roles/:id (detalle)
 * - PUT /roles/:id (respuesta después de update)
 * 
 * @example
 * ```typescript
 * const role: RoleResponse = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   name: 'Administrador',
 *   description: 'Acceso completo al sistema',
 *   isActive: true,
 *   createdAt: '2025-11-11T10:00:00Z',
 *   updatedAt: '2025-11-11T10:00:00Z',
 *   version: 1,
 * };
 * ```
 */
export interface RoleResponse {
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
