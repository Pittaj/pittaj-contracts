/**
 * @fileoverview Schemas Zod para sincronización de CreditNote.
 * @module Contracts/CreditNote/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que register/promotion/tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/credit-notes/sync/push — deriva del canónico src/sync */
export const syncPushCreditNoteSchema = syncPushRequestSchema;

/** POST /api/credit-notes/sync/pull — deriva del canónico src/sync */
export const syncPullCreditNoteSchema = syncPullRequestSchema;
