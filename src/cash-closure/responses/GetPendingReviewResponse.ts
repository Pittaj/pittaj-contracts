import type { CashClosureResponse } from './CashClosureResponse';

export interface GetPendingReviewResponse {
    readonly items: CashClosureResponse[];
    readonly total: number;
}
