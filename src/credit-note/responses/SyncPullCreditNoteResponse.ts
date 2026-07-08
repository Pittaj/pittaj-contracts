/**
 * @fileoverview Response de sincronización Pull de CreditNote.
 * @module Contracts/CreditNote/Responses/SyncPullCreditNoteResponse
 * @version 1.0.0
 *
 * Type-alias del response genérico canónico de src/sync: los `changes`
 * son DTOs planos de CreditNote (shape que ya parsea el desktop).
 */

import type { CreditNoteResponse } from './CreditNoteResponse';
import type { SyncPullResponse } from '../../sync';

export type SyncPullCreditNoteResponse = SyncPullResponse<CreditNoteResponse>;
