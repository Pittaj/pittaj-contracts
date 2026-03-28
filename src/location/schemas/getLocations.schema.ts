/**
 * @fileoverview Schema Zod para validación de consulta de ubicaciones.
 * 
 * Define las reglas de validación para el endpoint GET /locations:
 * - Filtro por company (obligatorio)
 * - Filtro por tipo (opcional)
 * - Filtro por estado activo (opcional)
 * 
 * @module Contracts/Location
 * @version 1.0.0
 * @since 11-11-2025
 */

import { z } from 'zod';

/**
 * Schema Zod para query params de GET /locations.
 * 
 * Usado para validar los parámetros de consulta.
 * 
 * @example
 * ```typescript
 * import { GetLocationsSchema } from '@pittaj/lib-contracts';
 * 
 * // GET /locations?companyId=uuid&type=BRANCH&onlyActive=true
 * const query = GetLocationsSchema.parse(c.req.query());
 * ```
 */
export const GetLocationsSchema = z.object({
  /**
   * ID de la company propietaria (UUID v4).
   * 
   * Opcional: si no se proporciona, retorna ubicaciones de todas las companies del tenant.
   * 
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  companyId: z.string().uuid('Company ID debe ser un UUID válido').optional(),

  /**
   * Filtrar por tipo de ubicación (opcional).
   * 
   * Valores válidos:
   * - BRANCH: Sucursales
   * - WAREHOUSE: Almacenes
   * - OFFICE: Oficinas
   * - FACTORY: Fábricas
   * 
   * Si no se proporciona, retorna todos los tipos.
   */
  type: z.enum(['BRANCH', 'WAREHOUSE', 'OFFICE', 'FACTORY']).optional(),

  /**
   * Filtrar solo ubicaciones activas.
   * 
   * Si es true, solo retorna ubicaciones con isActive=true.
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
export type GetLocationsQuery = z.infer<typeof GetLocationsSchema>;
