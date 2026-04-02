/**
 * @fileoverview Response DTO canónico de Customer
 * @module CustomerResponse
 * @version 1.0.0
 */

import type { CustomerCreditConfigPrimitives } from '../primitives';
import type { CustomerAddressPrimitives } from '../primitives';

export interface CustomerResponse {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly type: string;
    readonly status: string;
    readonly email: string | null;
    readonly phone: string | null;
    readonly taxId: string | null;
    readonly creditConfig: CustomerCreditConfigPrimitives;
    readonly address: CustomerAddressPrimitives | null;
    readonly notes: string | null;
    readonly tenantId: string;
    readonly createdAt: Date;
    readonly createdBy: string | null;
    readonly updatedAt: Date | null;
    readonly updatedBy: string | null;
    readonly version: number;
}
