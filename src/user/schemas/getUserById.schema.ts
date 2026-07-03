import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const getUserByIdSchema = userIdParamSchema;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
