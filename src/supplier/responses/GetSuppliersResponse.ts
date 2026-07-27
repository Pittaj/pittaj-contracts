/**
 * @fileoverview Response de la query GetSuppliers con paginación offset
 * @module Contracts/Supplier/Responses/GetSuppliersResponse
 * @version 1.0.0
 */

import type { SupplierResponse } from './SupplierResponse';

export interface GetSuppliersResponse {
    readonly items: SupplierResponse[];
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
}
