/**
 * @fileoverview Zod schema para validar query de obtención de permisos
 * @module Contracts/Permission
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Schema de validación para GetPermissionsQuery
 * 
 * Valida parámetros de query string para filtrar y paginar permisos:
 * - module: Filtro opcional por módulo
 * - scope: Filtro opcional por ámbito (MODULE, FEATURE, ACTION)
 * - search: Búsqueda opcional por texto
 * - page: Página actual (default: 1, min: 1)
 * - limit: Items por página (default: 50, min: 1, max: 100)
 * 
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // En controller
 * const query = getPermissionsSchema.parse(c.req.query());
 * ```
 */
export const getPermissionsSchema = z.object({
  /**
   * Filtrar por módulo específico
   * Ejemplo: 'users', 'products', 'categories'
   */
  module: z.string().min(1).max(50).optional(),

  /**
   * Filtrar por ámbito del permiso
   * Valores permitidos: 'MODULE', 'FEATURE', 'ACTION'
   */
  scope: z.enum(['MODULE', 'FEATURE', 'ACTION']).optional(),

  /**
   * Búsqueda por texto en código, nombre o descripción
   * Mínimo 2 caracteres
   */
  search: z.string().min(2).max(100).optional(),

  /**
   * Número de página (1-indexed)
   * Default: 1
   * Mínimo: 1
   */
  page: z.coerce.number().int().min(1).default(1),

  /**
   * Cantidad de items por página
   * Default: 50
   * Mínimo: 1
   * Máximo: 100
   */
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Tipo TypeScript inferido del schema
 */
export type GetPermissionsSchemaType = z.infer<typeof getPermissionsSchema>;
