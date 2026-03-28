/**
 * @fileoverview Zod schema para validar el request de creación de roles.
 * 
 * Valida:
 * - name: 2-100 caracteres, solo letras, números, espacios, guiones
 * - description: 0-500 caracteres (opcional)
 * - id: UUID opcional para PWA offline-first
 * 
 * @module SharedContracts/Role
 * @version 1.0.0
 * @since 11-11-2025
 */

import { z } from 'zod';

/**
 * Regex para validar nombres de roles.
 * 
 * Permite:
 * - Letras (a-z, A-Z)
 * - Números (0-9)
 * - Espacios
 * - Guiones (-)
 * - Caracteres acentuados (áéíóúñ)
 * 
 * Ejemplos válidos:
 * - "Administrador"
 * - "Gerente General"
 * - "Cajero-Principal"
 * - "Auditor 2023"
 */
const NAME_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]+$/;

/**
 * Mensajes de error en español.
 */
const ERROR_MESSAGES = {
  NAME_REQUIRED: 'El nombre del rol es requerido',
  NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
  NAME_TOO_LONG: 'El nombre no puede exceder 100 caracteres',
  NAME_INVALID_FORMAT: 'El nombre solo puede contener letras, números, espacios y guiones',
  DESCRIPTION_TOO_LONG: 'La descripción no puede exceder 500 caracteres',
  ID_INVALID_UUID: 'El ID debe ser un UUID válido',
};

/**
 * Schema de validación para crear un rol.
 * 
 * @example
 * ```typescript
 * const validData = {
 *   id: crypto.randomUUID(),
 *   name: 'Administrador',
 *   description: 'Rol con acceso completo al sistema',
 * };
 * 
 * const result = CreateRoleSchema.safeParse(validData);
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export const CreateRoleSchema = z
  .object({
    /**
     * ID del rol (obligatorio - para offline-first).
     * 
     * El frontend genera el UUID con crypto.randomUUID().
     */
    id: z
      .string()
      .uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),

    /**
     * Nombre del rol.
     * 
     * Requerido, único por tenant, 2-100 caracteres.
     */
    name: z
      .string({ required_error: ERROR_MESSAGES.NAME_REQUIRED })
      .min(2, { message: ERROR_MESSAGES.NAME_TOO_SHORT })
      .max(100, { message: ERROR_MESSAGES.NAME_TOO_LONG })
      .regex(NAME_REGEX, { message: ERROR_MESSAGES.NAME_INVALID_FORMAT })
      .trim(),

    /**
     * Descripción del rol (opcional).
     * 
     * Máximo 500 caracteres.
     */
    description: z
      .string()
      .max(500, { message: ERROR_MESSAGES.DESCRIPTION_TOO_LONG })
      .trim()
      .optional(),
  })
  .strict(); // No permitir campos adicionales

/**
 * Tipo inferido del schema.
 * 
 * @example
 * ```typescript
 * const data: CreateRoleRequest = {
 *   id: crypto.randomUUID(),
 *   name: 'Gerente',
 *   description: 'Gerente de tienda',
 * };
 * ```
 */
export type CreateRoleRequest = z.infer<typeof CreateRoleSchema>;
