import type { CashClosureResponse } from './CashClosureResponse';

export interface GetCashClosuresResponse {
    readonly items: CashClosureResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
