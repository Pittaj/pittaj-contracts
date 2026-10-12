import { z } from 'zod';
import { accesoWebSchema } from './accesoWeb.schema.js';

export const changeUserPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  /** El par derivado de `newPassword` para la web (ver accesoWeb.schema.ts). Sin él, la web conserva la vieja. */
  acceso: accesoWebSchema.optional(),
});

export type ChangeUserPasswordInput = z.infer<typeof changeUserPasswordSchema>;
