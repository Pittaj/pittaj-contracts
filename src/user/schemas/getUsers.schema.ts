/**
 * @fileoverview Schema Zod para validación de query parameters en GET /users.
 * 
 * Define las reglas de validación para filtros y paginación:
 * - isActive (boolean optional)
 * - search (string optional)
 * - page (número >= 1)
 * - limit (número 1-100)
 * 
 * @module Contracts/User
 * @version 1.0.0
 * @since 11-11-2025
 */

import { z } from 'zod';

/**
 * Schema Zod para query parameters de GET /users.
 * 
 * Todos los parámetros son opcionales y tienen valores por defecto.
 * 
 * @example
 * ```typescript
 * import { GetUsersSchema } from '@pittaj/lib-contracts';
 * 
 * // Validar query params
 * const result = GetUsersSchema.safeParse({
 *   isActive: 'true',
 *   search: 'juan',
 *   page: '1',
 *   limit: '20',
 * });
 * ```
 */
export const GetUsersSchema = z.object({
  /**
   * Filtrar por estado activo/inactivo.
   * 
   * Query param: ?isActive=true o ?isActive=false
   * 
   * Valores:
   * - 'true' → Solo usuarios activos
   * - 'false' → Solo usuarios inactivos
   * - undefined → Todos los usuarios
   */
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),

  /**
   * Término de búsqueda.
   * 
   * Query param: ?search=juan
   * 
   * Busca en:
   * - firstName (case-insensitive)
   * - lastName (case-insensitive)
   * - email (case-insensitive)
   */
  search: z
    .string()
    .min(1, 'El término de búsqueda debe tener al menos 1 caracter')
    .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
    .trim()
    .optional(),

  /**
   * Número de página (base 1).
   * 
   * Query param: ?page=1
   * 
   * Validaciones:
   * - Mínimo: 1
   * - Default: 1
   * - Se convierte de string a number
   */
  page: z
    .string()
    .regex(/^\d+$/, 'La página debe ser un número entero')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, 'La página debe ser mayor o igual a 1'))
    .default('1'),

  /**
   * Cantidad de resultados por página.
   * 
   * Query param: ?limit=20
   * 
   * Validaciones:
   * - Mínimo: 1
   * - Máximo: 100
   * - Default: 50
   * - Se convierte de string a number
   */
  limit: z
    .string()
    .regex(/^\d+$/, 'El límite debe ser un número entero')
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int()
        .min(1, 'El límite debe ser mayor o igual a 1')
        .max(100, 'El límite no puede exceder 100')
    )
    .default('50'),
});

/**
 * Tipo TypeScript inferido del schema.
 * 
 * Usado en controllers para type-safety de query params.
 */
export type GetUsersQuery = z.infer<typeof GetUsersSchema>;
