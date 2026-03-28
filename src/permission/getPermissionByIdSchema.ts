/**
 * @fileoverview Zod schema para validar obtención de permiso por ID
 * @module Contracts/Permission
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Schema de validación para GetPermissionByIdQuery
 * 
 * Valida el parámetro de ruta (path param) para obtener un permiso:
 * - id: UUID del permiso (formato UUID válido)
 * 
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // En controller
 * const { id } = getPermissionByIdSchema.parse({ id: c.req.param('id') });
 * ```
 */
export const getPermissionByIdSchema = z.object({
  /**
   * ID del permiso (UUID)
   * Debe ser un UUID válido
   */
  id: z.string().uuid({
    message: 'El ID debe ser un UUID válido',
  }),
});

/**
 * Tipo TypeScript inferido del schema
 */
export type GetPermissionByIdSchemaType = z.infer<typeof getPermissionByIdSchema>;
