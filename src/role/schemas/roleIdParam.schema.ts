/**
 * @fileoverview Zod schema para validar el parámetro de ruta :id (UUID).
 *
 * Usado en endpoints:
 * - GET /roles/:id
 * - PUT /roles/:id
 * - DELETE /roles/:id
 * - POST /roles/:id/activate
 * - POST /roles/:id/deactivate
 *
 * @module Contracts/Role/Schemas
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Mensajes de error en español.
 */
const ERROR_MESSAGES = {
  ID_INVALID_UUID: 'El ID del rol debe ser un UUID válido',
};

/**
 * Schema para validar el parámetro :id en rutas.
 *
 * @example
 * ```typescript
 * // En Hono route:
 * router.get('/:id',
 *   zValidator('param', RoleIdParamSchema, zodValidationHook),
 *   async (c) => { ... }
 * );
 * ```
 */
export const RoleIdParamSchema = z.object({
  id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
});

/**
 * Tipo inferido del schema.
 */
export type RoleIdParam = z.infer<typeof RoleIdParamSchema>;
