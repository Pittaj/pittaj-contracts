/**
 * @fileoverview Lista paginada de cobros.
 * @module Contracts/CustomerPayment
 */

import type { CustomerPaymentResponse } from './CustomerPaymentResponse.js';

export interface GetCustomerPaymentsResponse {
    readonly items: readonly CustomerPaymentResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
