import type { PosSessionResponse } from './PosSessionResponse.js';

export interface GetActiveSessionResponse {
    readonly session: PosSessionResponse | null;
}
