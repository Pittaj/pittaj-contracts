/**
 * @fileoverview Schema Zod para path param y query de GET /companies/:id.
 * @module Contracts/Company
 */
import { z } from 'zod';

export const companyIdParamSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type CompanyIdParam = z.infer<typeof companyIdParamSchema>;
