/**
 * @fileoverview Response de la query GetCreditDebtors
 * @module GetCreditDebtorsResponse
 * @version 1.0.0
 */

import type { CustomerResponse } from './CustomerResponse';

export interface GetCreditDebtorsResponse {
    readonly items: CustomerResponse[];
    readonly total: number;
}
