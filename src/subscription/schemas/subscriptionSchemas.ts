import { z } from 'zod';

// ─── Constants ─────────────────────────────────────────────────
export const SUBSCRIPTION_CONSTANTS = {
  STATUSES: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED'],
} as const;

// ─── Params ────────────────────────────────────────────────────
export const subscriptionIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type SubscriptionIdParam = z.infer<typeof subscriptionIdParamSchema>;

// ─── List (backoffice admin) ───────────────────────────────────
export const listSubscriptionsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED']).optional(),
  tenantId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'trialEndsAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ─── Create Trial ──────────────────────────────────────────────
// Modelo de precio único por sucursal: sin plan.
export const createTrialSubscriptionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
});

// ─── Lifecycle (admin) ─────────────────────────────────────────
export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const suspendSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const reactivateSubscriptionSchema = z.object({});

// ─── Inferred types ────────────────────────────────────────────
export type CreateTrialSubscriptionRequest = z.infer<typeof createTrialSubscriptionSchema>;
export type CancelSubscriptionRequest = z.infer<typeof cancelSubscriptionSchema>;
export type SuspendSubscriptionRequest = z.infer<typeof suspendSubscriptionSchema>;
export type ListSubscriptionsInput = z.infer<typeof listSubscriptionsSchema>;
