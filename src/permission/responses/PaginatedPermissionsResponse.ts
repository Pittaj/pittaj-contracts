/**
 * @fileoverview DTO para respuesta paginada de permisos
 * @module Permission/Application/DTOs
 * @version 1.0.0
 */

import type { PermissionResponse } from './PermissionResponse';

/**
 * DTO para respuestas paginadas de permisos
 * 
 * @interface PaginatedPermissionsResponse
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const response: PaginatedPermissionsResponse = {
 *   items: [
 *     { id: '...', code: 'users.create', ... },
 *     { id: '...', code: 'users.read', ... },
 *   ],
 *   total: 78,
 *   page: 1,
 *   limit: 50,
 *   totalPages: 2,
 *   hasNextPage: true,
 *   hasPreviousPage: false,
 * };
 * ```
 */
export interface PaginatedPermissionsResponse {
  /**
   * Array de permisos en la página actual
   */
  readonly items: PermissionResponse[];

  /**
   * Total de permisos que cumplen los filtros
   */
  readonly total: number;

  /**
   * Número de página actual (1-indexed)
   */
  readonly page: number;

  /**
   * Cantidad de items por página
   */
  readonly limit: number;

  /**
   * Total de páginas disponibles
   */
  readonly totalPages: number;

  /**
   * Indica si hay una página siguiente
   */
  readonly hasNextPage: boolean;

  /**
   * Indica si hay una página anterior
   */
  readonly hasPreviousPage: boolean;
}
