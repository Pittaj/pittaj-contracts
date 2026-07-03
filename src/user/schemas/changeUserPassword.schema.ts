import { z } from 'zod';

export const changeUserPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export type ChangeUserPasswordInput = z.infer<typeof changeUserPasswordSchema>;
