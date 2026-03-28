import type { PosSessionResponse } from './PosSessionResponse';

export interface SyncPullPosSessionsResponse {
    readonly items: PosSessionResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
