import type { CashClosureResponse } from './CashClosureResponse.js';

export interface GetPendingReviewResponse {
    readonly items: CashClosureResponse[];
    readonly total: number;
}
