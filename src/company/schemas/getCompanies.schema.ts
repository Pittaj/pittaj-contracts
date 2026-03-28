/**
 * @fileoverview Schema Zod para validación de consulta de empresas.
 * 
 * Define las reglas de validación para el endpoint GET /companies:
 * - Filtro por estado activo (opcional)
 * 
 * @module Contracts/Company
 * @version 1.0.0
 * @since 11-11-2025
 */

import { z } from 'zod';

/**
 * Schema Zod para query params de GET /companies.
 * 
 * Usado para validar los parámetros de consulta.
 * 
 * @example
 * ```typescript
 * import { GetCompaniesSchema } from '@pittaj/lib-contracts';
 * 
 * // GET /companies?onlyActive=true
 * const query = GetCompaniesSchema.parse(c.req.query());
 * ```
 */
export const GetCompaniesSchema = z.object({
  /**
   * Filtrar solo empresas activas.
   * 
   * Si es true, solo retorna empresas con isActive=true.
   * Si es false o no se proporciona, retorna todas.
   * 
   * @default false
   */
  onlyActive: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .pipe(z.boolean()),
});

/**
 * Tipo inferido del schema.
 */
export type GetCompaniesQuery = z.infer<typeof GetCompaniesSchema>;
