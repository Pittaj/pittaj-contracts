import { z } from 'zod';

export const createInvitationSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'cashier', 'viewer']),
  invitedBy: z.string().uuid(),
  expiresInDays: z.number().int().min(1).max(30).optional().default(7),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export const invitationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const validateInvitationSchema = z.object({
  token: z.string().min(1),
});

export type CreateInvitationRequest = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationRequest = z.infer<typeof acceptInvitationSchema>;
