/**
 * @fileoverview Schema Zod para actualización de empresa.
 *
 * Define reglas de validación para PUT /companies/:id:
 * - Version requerida para OCC
 * - Campos opcionales para actualización parcial
 *
 * @module Contracts/Company
 * @version 1.0.0
 * @since 2025
 */
import { z } from 'zod';

const TAX_ID_REGEX = /^[A-Z0-9-]{8,20}$/i;

export const updateCompanySchema = z.object({
  version: z.number().int().min(1, 'La version debe ser mayor o igual a 1'),
  name: z.string().min(2).max(100).trim().optional(),
  // legalName/taxId son opcionales en la empresa: undefined = sin cambio, null = limpiar el valor
  legalName: z.string().min(2).max(200).trim().nullish(),
  taxId: z.string().regex(TAX_ID_REGEX, 'Tax ID debe ser alfanumérico (8-20 caracteres)').trim().toUpperCase().nullish(),
  isDefault: z.boolean().optional(),
});

export type UpdateCompanyRequest = z.infer<typeof updateCompanySchema>;
