/**
 * @fileoverview Zod schema para validar query parameters de consulta de roles.
 * 
 * Valida:
 * - isActive: string → boolean (opcional)
 * - search: 1-100 caracteres (opcional)
 * - page: número >= 1 (default 1)
 * - limit: número 1-100 (default 50)
 * 
 * @module SharedContracts/Role
 * @version 1.0.0
 * @since 11-11-2025
 */

import { z } from 'zod';

/**
 * Mensajes de error en español.
 */
const ERROR_MESSAGES = {
  SEARCH_TOO_SHORT: 'El término de búsqueda debe tener al menos 1 carácter',
  SEARCH_TOO_LONG: 'El término de búsqueda no puede exceder 100 caracteres',
  PAGE_MIN: 'La página debe ser mayor o igual a 1',
  LIMIT_MIN: 'El límite debe ser al menos 1',
  LIMIT_MAX: 'El límite no puede exceder 100',
  BOOLEAN_INVALID: 'El valor debe ser "true" o "false"',
};

/**
 * Schema de validación para query parameters de listado de roles.
 * 
 * Transforma strings de URL a tipos correctos:
 * - "true"/"false" → boolean
 * - "42" → number
 * 
 * @example
 * ```typescript
 * // URL: /api/roles?isActive=true&search=admin&page=2&limit=20
 * const result = GetRolesSchema.safeParse({
 *   isActive: 'true',
 *   search: 'admin',
 *   page: '2',
 *   limit: '20',
 * });
 * 
 * if (result.success) {
 *   console.log(result.data);
 *   // {
 *   //   isActive: true,
 *   //   search: 'admin',
 *   //   page: 2,
 *   //   limit: 20,
 *   // }
 * }
 * ```
 */
export const GetRolesSchema = z
  .object({
    /**
     * Filtrar por estado activo/inactivo.
     * 
     * Acepta: "true", "false" (case-insensitive)
     * Transforma a: boolean
     */
    isActive: z
      .enum(['true', 'false'], {
        errorMap: () => ({ message: ERROR_MESSAGES.BOOLEAN_INVALID }),
      })
      .transform((val) => val === 'true')
      .optional(),

    /**
     * Término de búsqueda (busca en nombre y descripción).
     * 
     * 1-100 caracteres, trimmed.
     */
    search: z
      .string()
      .min(1, { message: ERROR_MESSAGES.SEARCH_TOO_SHORT })
      .max(100, { message: ERROR_MESSAGES.SEARCH_TOO_LONG })
      .trim()
      .optional(),

    /**
     * Número de página (default: 1).
     * 
     * Acepta: string numérico
     * Transforma a: number
     */
    page: z
      .string()
      .default('1')
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1, { message: ERROR_MESSAGES.PAGE_MIN })),

    /**
     * Cantidad de items por página (default: 50, max: 100).
     * 
     * Acepta: string numérico
     * Transforma a: number
     */
    limit: z
      .string()
      .default('50')
      .transform((val) => parseInt(val, 10))
      .pipe(
        z
          .number()
          .int()
          .min(1, { message: ERROR_MESSAGES.LIMIT_MIN })
          .max(100, { message: ERROR_MESSAGES.LIMIT_MAX })
      ),
  })
  .strict(); // No permitir campos adicionales

/**
 * Tipo inferido del schema (después de transformaciones).
 * 
 * @example
 * ```typescript
 * const query: GetRolesQuery = {
 *   isActive: true,
 *   search: 'gerente',
 *   page: 1,
 *   limit: 50,
 * };
 * ```
 */
export type GetRolesQuery = z.infer<typeof GetRolesSchema>;
