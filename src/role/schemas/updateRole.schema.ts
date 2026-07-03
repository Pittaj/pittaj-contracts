/**
 * @fileoverview Zod schema para validar el request de actualización de roles.
 *
 * Valida:
 * - name: 2-100 caracteres, opcional
 * - description: 0-500 caracteres, opcional
 * - version: number int min 1 (obligatorio, para optimistic locking)
 *
 * @module Contracts/Role/Schemas
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Regex para validar nombres de roles.
 */
const NAME_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]+$/;

/**
 * Mensajes de error en español.
 */
const ERROR_MESSAGES = {
  VERSION_REQUIRED: 'La versión es requerida para control de concurrencia',
  VERSION_MIN: 'La versión debe ser un entero mayor o igual a 1',
  NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
  NAME_TOO_LONG: 'El nombre no puede exceder 100 caracteres',
  NAME_INVALID_FORMAT: 'El nombre solo puede contener letras, números, espacios y guiones',
  DESCRIPTION_TOO_LONG: 'La descripción no puede exceder 500 caracteres',
};

/**
 * Schema de validación para actualizar un rol.
 *
 * Requiere `version` para optimistic locking.
 * `name` y `description` son opcionales — al menos uno debe ser proporcionado
 * (validado en capa de aplicación).
 *
 * @example
 * ```typescript
 * const validData = {
 *   version: 2,
 *   name: 'Super Admin',
 *   description: 'Acceso total al sistema',
 * };
 *
 * const result = UpdateRoleSchema.safeParse(validData);
 * ```
 */
export const UpdateRoleSchema = z
  .object({
    /**
     * Versión actual del rol para optimistic locking.
     * Debe coincidir con la versión almacenada en la base de datos.
     */
    version: z
      .number({
        required_error: ERROR_MESSAGES.VERSION_REQUIRED,
        invalid_type_error: ERROR_MESSAGES.VERSION_REQUIRED,
      })
      .int({ message: ERROR_MESSAGES.VERSION_MIN })
      .min(1, { message: ERROR_MESSAGES.VERSION_MIN }),

    /**
     * Nombre del rol (opcional).
     *
     * 2-50 caracteres, único por tenant
     * (el VO de dominio RoleName limita a 50).
     */
    name: z
      .string()
      .min(2, { message: ERROR_MESSAGES.NAME_TOO_SHORT })
      .max(50, { message: ERROR_MESSAGES.NAME_TOO_LONG })
      .regex(NAME_REGEX, { message: ERROR_MESSAGES.NAME_INVALID_FORMAT })
      .trim()
      .optional(),

    /**
     * Descripción del rol (opcional).
     *
     * Máximo 500 caracteres.
     * Pasar `null` para eliminar la descripción.
     */
    description: z
      .string()
      .max(500, { message: ERROR_MESSAGES.DESCRIPTION_TOO_LONG })
      .trim()
      .optional()
      .nullable(),
  })
  .strict();

/**
 * Tipo inferido del schema.
 *
 * @example
 * ```typescript
 * const data: UpdateRoleRequest = {
 *   version: 2,
 *   name: 'Administrador',
 * };
 * ```
 */
export type UpdateRoleRequest = z.infer<typeof UpdateRoleSchema>;
