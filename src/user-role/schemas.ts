/**
 * @fileoverview Schemas de validación Zod para UserRole
 * @module UserRoleSchemas
 * @version 1.0.0
 * 
 * Schemas compartidos entre backend y frontend para validación consistente.
 */

import { z } from 'zod';

/**
 * Schema para asignar un rol a un usuario.
 * 
 * @example
 * ```typescript
 * const result = assignRoleToUserSchema.safeParse({
 *   userId: 'user-123',
 *   roleId: 'role-admin'
 * });
 * ```
 */
export const assignRoleToUserSchema = z.object({
  userId: z.string().uuid('userId debe ser un UUID válido'),
  roleId: z.string().uuid('roleId debe ser un UUID válido'),
});

/**
 * Schema para revocar un rol de un usuario.
 * 
 * @example
 * ```typescript
 * const result = revokeRoleFromUserSchema.safeParse({
 *   userId: 'user-123',
 *   roleId: 'role-admin'
 * });
 * ```
 */
export const revokeRoleFromUserSchema = z.object({
  userId: z.string().uuid('userId debe ser un UUID válido'),
  roleId: z.string().uuid('roleId debe ser un UUID válido'),
});

/**
 * Schema para obtener roles de un usuario.
 * 
 * @example
 * ```typescript
 * const result = getUserRolesByUserIdSchema.safeParse({
 *   userId: 'user-123'
 * });
 * ```
 */
export const getUserRolesByUserIdSchema = z.object({
  userId: z.string().uuid('userId debe ser un UUID válido'),
});
