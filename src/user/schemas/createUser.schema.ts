/**
 * @fileoverview Schema Zod para validación de creación de usuario.
 * 
 * Define las reglas de validación para el endpoint POST /users:
 * - Email formato válido y único
 * - Password fuerte (8+ chars, mayúscula, minúscula, número, símbolo)
 * - Nombres con longitud mínima/máxima
 * - Campos opcionales (phone, username)
 * - ID obligatorio (UUID generado por frontend para offline-first)
 * 
 * @module Contracts/User
 * @version 1.0.0
 * @since 11-11-2025
 */

import { z } from 'zod';

/**
 * Regex para validar password fuerte.
 * 
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos 1 letra mayúscula
 * - Al menos 1 letra minúscula
 * - Al menos 1 número
 * - Al menos 1 símbolo especial
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Regex para validar nombres (solo letras, espacios y guiones).
 */
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/;

/**
 * Schema Zod para crear un usuario.
 * 
 * Usado en POST /users para validar el body del request.
 * 
 * @example
 * ```typescript
 * import { CreateUserSchema } from '@pittaj/lib-contracts';
 * 
 * const result = CreateUserSchema.safeParse(body);
 * if (!result.success) {
 *   return c.json({ errors: result.error.errors }, 400);
 * }
 * ```
 */
export const CreateUserSchema = z.object({
  /**
   * ID del usuario (UUID v4).
   * 
   * Obligatorio para offline-first:
   * - Cliente genera UUID offline
   * - Backend respeta el ID recibido
   */
  id: z.string().uuid(),

  /**
   * Nombre del usuario.
   * 
   * Validaciones:
   * - Mínimo 2 caracteres
   * - Máximo 50 caracteres
   * - Solo letras, espacios, guiones y acentos
   */
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(NAME_REGEX, 'El nombre solo puede contener letras, espacios y guiones')
    .trim(),

  /**
   * Apellido del usuario.
   * 
   * Validaciones:
   * - Mínimo 2 caracteres
   * - Máximo 50 caracteres
   * - Solo letras, espacios, guiones y acentos
   */
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(NAME_REGEX, 'El apellido solo puede contener letras, espacios y guiones')
    .trim(),

  /**
   * Email del usuario.
   * 
   * Validaciones:
   * - Formato válido de email
   * - Máximo 255 caracteres
   * - Se convierte a lowercase automáticamente
   */
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .toLowerCase()
    .trim(),

  /**
   * Contraseña del usuario.
   * 
   * Validaciones:
   * - Mínimo 8 caracteres
   * - Al menos 1 mayúscula
   * - Al menos 1 minúscula
   * - Al menos 1 número
   * - Al menos 1 símbolo especial (@$!%*?&)
   */
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(
      PASSWORD_REGEX,
      'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo especial'
    ),

  /**
   * Teléfono del usuario (opcional).
   * 
   * Formato libre, máximo 20 caracteres.
   */
  phone: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .trim()
    .optional(),

  /**
   * Nombre de usuario único (username).
   * 
   * Usado para login (alternativa al email).
   * 
   * Validaciones:
   * - Mínimo 3 caracteres
   * - Máximo 30 caracteres
   * - Solo letras, números, guiones y guiones bajos
   */
  username: z
    .string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(30, 'El username no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El username solo puede contener letras, números, guiones y guiones bajos')
    .trim()
    .optional(),
});

/**
 * Tipo TypeScript inferido del schema.
 * 
 * Usado en controllers y handlers para type-safety.
 */
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
