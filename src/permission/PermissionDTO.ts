/**
 * @fileoverview Data Transfer Object para Permission
 * @module Permission/Application/DTOs
 * @version 1.0.0
 */

/**
 * DTO para transferir datos de Permission entre capas
 * 
 * NOTA: Los permisos son GLOBALES (sin tenantId).
 * Son compartidos por todos los tenants del sistema.
 * 
 * @interface PermissionDTO
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const dto: PermissionDTO = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   code: 'users.create',
 *   name: 'Crear Usuario',
 *   description: 'Permite crear nuevos usuarios en el sistema',
 *   scope: 'ACTION',
 *   module: 'users',
 *   createdAt: '2025-01-01T00:00:00Z',
 *   updatedAt: null,
 * };
 * ```
 */
export interface PermissionDTO {
  /**
   * ID único del permiso (UUID)
   */
  readonly id: string;

  /**
   * Código único en formato module.action
   * Ejemplos: 'users.create', 'products.read'
   */
  readonly code: string;

  /**
   * Nombre descriptivo del permiso
   * Ejemplo: 'Crear Usuario'
   */
  readonly name: string;

  /**
   * Descripción detallada de qué permite hacer
   */
  readonly description: string;

  /**
   * Ámbito del permiso: MODULE, FEATURE, ACTION
   */
  readonly scope: string;

  /**
   * Módulo al que pertenece el permiso
   * Ejemplo: 'users', 'products'
   */
  readonly module: string;

  /**
   * Fecha de creación
   */
  readonly createdAt: string;

  /**
   * Fecha de última actualización (null si nunca se actualizó)
   */
  readonly updatedAt: string | null;
}
