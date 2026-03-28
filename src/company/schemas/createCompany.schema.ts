/**
 * @fileoverview Schema Zod para validación de creación de empresa.
 * 
 * Define las reglas de validación para el endpoint POST /companies:
 * - Nombre comercial (2-100 caracteres)
 * - Nombre legal completo (2-200 caracteres)
 * - Tax ID válido (RUC, NIF, EIN, etc.)
 * - Flag isDefault opcional
 * - ID opcional para PWA offline-first
 * 
 * @module Contracts/Company
 * @version 1.0.0
 * @since 11-11-2025
 */

import { z } from 'zod';

/**
 * Regex para validar Tax ID.
 * 
 * Acepta formatos comunes:
 * - RUC (Ecuador): 13 dígitos
 * - NIF (España): 8 dígitos + letra
 * - RFC (México): 12-13 caracteres alfanuméricos
 * - EIN (USA): XX-XXXXXXX
 * 
 * Formato general: Alfanumérico con guiones opcionales
 */
const TAX_ID_REGEX = /^[A-Z0-9-]{8,20}$/i;

/**
 * Schema Zod para crear una empresa.
 * 
 * Usado en POST /companies para validar el body del request.
 * 
 * @example
 * ```typescript
 * import { CreateCompanySchema } from '@pittaj/lib-contracts';
 * 
 * const result = CreateCompanySchema.safeParse(body);
 * if (!result.success) {
 *   return c.json({ errors: result.error.errors }, 400);
 * }
 * ```
 */
export const CreateCompanySchema = z.object({
  /**
   * ID opcional de la empresa (UUID v4).
   * 
   * Para soporte PWA offline-first:
   * - Cliente genera UUID offline
   * - Servidor respeta el ID del cliente
   * - Si no se proporciona, servidor genera uno nuevo
   */
  id: z.string().uuid().optional(),

  /**
   * Nombre comercial de la empresa.
   * 
   * Requisitos:
   * - Longitud: 2-100 caracteres
   * - Usado para mostrar en UI
   * 
   * @example "Tienda El Sol"
   */
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  /**
   * Nombre legal completo de la empresa.
   * 
   * Requisitos:
   * - Longitud: 2-200 caracteres
   * - Nombre registrado legalmente (Razón Social)
   * 
   * @example "Comercializadora El Sol S.A. de C.V."
   */
  legalName: z.string()
    .min(2, 'El nombre legal debe tener al menos 2 caracteres')
    .max(200, 'El nombre legal no puede exceder 200 caracteres')
    .trim(),

  /**
   * Identificación fiscal (RUC, NIF, RFC, EIN, etc.).
   * 
   * Requisitos:
   * - Formato alfanumérico con guiones opcionales
   * - Longitud: 8-20 caracteres
   * - Único por tenant
   * 
   * @example
   * - Ecuador: "1792146739001" (RUC)
   * - España: "12345678A" (NIF)
   * - México: "ABC123456XYZ" (RFC)
   * - USA: "12-3456789" (EIN)
   */
  taxId: z.string()
    .regex(TAX_ID_REGEX, 'Tax ID debe ser alfanumérico (8-20 caracteres)')
    .trim()
    .toUpperCase(),

  /**
   * Indica si es la empresa por defecto del tenant.
   * 
   * Solo puede haber UNA empresa default por tenant.
   * Si se marca otra como default, se desmarca la anterior.
   * 
   * @default false
   */
  isDefault: z.boolean().optional().default(false),
});

/**
 * Tipo inferido del schema.
 */
export type CreateCompanyRequest = z.infer<typeof CreateCompanySchema>;
