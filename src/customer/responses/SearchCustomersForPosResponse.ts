/**
 * @fileoverview Response de búsqueda rápida de clientes para TPV
 * @module SearchCustomersForPosResponse
 * @version 1.0.0
 */

import type { CustomerResponse } from './CustomerResponse.js';

export interface SearchCustomersForPosResponse {
    readonly items: CustomerResponse[];
    readonly total: number;
}
