import type { PosSessionResponse } from './PosSessionResponse.js';

export interface GetOpenByLocationResponse {
    readonly items: PosSessionResponse[];
    readonly total: number;
}
