/**
 * @fileoverview Response de sincronización Pull de PosTicket
 * @module SyncPullPosTicketResponse
 * @version 1.0.0
 */

import type { PosTicketResponse } from './PosTicketResponse';

export interface SyncPullPosTicketResponse {
    readonly changes: PosTicketResponse[];
    readonly lastSyncedAt: Date;
    readonly hasMore: boolean;
}
