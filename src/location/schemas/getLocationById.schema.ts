/** @fileoverview Schema para path param de GET /locations/:id */
import { z } from 'zod';

export const locationIdParamSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type LocationIdParam = z.infer<typeof locationIdParamSchema>;
