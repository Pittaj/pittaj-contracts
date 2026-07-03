import { z } from 'zod';

export const changeUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
});

export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;
