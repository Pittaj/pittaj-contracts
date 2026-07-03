import { z } from 'zod';

// ─── Constants ─────────────────────────────────────────────────
export const SUBSCRIPTION_CONSTANTS = {
  STATUSES: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
} as const;

// ─── Params ────────────────────────────────────────────────────
export const subscriptionIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type SubscriptionIdParam = z.infer<typeof subscriptionIdParamSchema>;

// ─── List ──────────────────────────────────────────────────────
export const listSubscriptionsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.string().optional(),
  tenantId: z.string().uuid().optional(),
  plan: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'trialEndsAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ─── Create Trial ──────────────────────────────────────────────
export const createTrialSubscriptionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).optional(),
});

// ─── Cancel ────────────────────────────────────────────────────
export const cancelSubscriptionSchema = z.object({
  version: z.number().int().min(1),
});

// ─── Change Plan ───────────────────────────────────────────────
export const changePlanSchema = z.object({
  version: z.number().int().min(1),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
});

// ─── Inferred types ────────────────────────────────────────────
export type CreateTrialSubscriptionRequest = z.infer<typeof createTrialSubscriptionSchema>;
export type CancelSubscriptionRequest = z.infer<typeof cancelSubscriptionSchema>;
export type ChangePlanRequest = z.infer<typeof changePlanSchema>;
export type ListSubscriptionsInput = z.infer<typeof listSubscriptionsSchema>;
