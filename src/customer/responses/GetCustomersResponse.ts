/**
 * @fileoverview Response de la query GetCustomers con paginación offset
 * @module GetCustomersResponse
 * @version 1.0.0
 */

import type { CustomerResponse } from './CustomerResponse';

export interface GetCustomersResponse {
    readonly items: CustomerResponse[];
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
}
