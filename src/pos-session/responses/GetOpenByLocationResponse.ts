import type { PosSessionResponse } from './PosSessionResponse';

export interface GetOpenByLocationResponse {
    readonly items: PosSessionResponse[];
    readonly total: number;
}
