import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().min(10).max(15).optional().nullable(),
  language: z.enum(['es', 'en', 'pt']).optional(),
  timezone: z.string().max(50).optional(),
  preferences: z.record(z.unknown()).optional().nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
