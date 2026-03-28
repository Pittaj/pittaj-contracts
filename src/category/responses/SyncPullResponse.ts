import type { CategoryListResponse } from './CategoryListResponse';

export interface SyncPullResponse {
    changes: CategoryListResponse[];
    lastSyncedAt: Date;
    hasMore: boolean;
}
