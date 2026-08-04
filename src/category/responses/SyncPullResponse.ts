import type { CategoryListResponse } from './CategoryListResponse.js';

export interface SyncPullResponse {
    changes: CategoryListResponse[];
    lastSyncedAt: Date;
    hasMore: boolean;
}
