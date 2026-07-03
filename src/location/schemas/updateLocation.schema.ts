/** @fileoverview Schema Zod para actualización de ubicación. */
import { z } from 'zod';

export const updateLocationSchema = z.object({
  version: z.number().int().min(1),
  name: z.string().min(2).max(100).trim().optional(),
  type: z.enum(['BRANCH', 'WAREHOUSE', 'OFFICE', 'FACTORY']).optional(),
  capabilities: z.object({
    hasPointOfSale: z.boolean(),
    hasInventory: z.boolean(),
    hasProduction: z.boolean(),
    hasShipping: z.boolean(),
    isHeadquarters: z.boolean(),
  }).optional(),
  // Alineado con CreateLocationSchema: country acepta el nombre completo (p.ej. "México"),
  // no solo código ISO-2 — antes min(2).max(2) rechazaba cualquier update con dirección.
  address: z.object({
    street: z.string().min(5).max(200).trim(),
    city: z.string().min(2).max(100).trim(),
    state: z.string().min(2).max(100).trim(),
    country: z.string().min(2).max(100).trim(),
    zipCode: z.string().max(20).trim().optional(),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
});

export type UpdateLocationRequest = z.infer<typeof updateLocationSchema>;
