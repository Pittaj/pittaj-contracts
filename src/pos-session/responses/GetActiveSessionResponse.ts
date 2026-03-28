import type { PosSessionResponse } from './PosSessionResponse';

export interface GetActiveSessionResponse {
    readonly session: PosSessionResponse | null;
}
