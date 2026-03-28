/**
 * @fileoverview Response DTO canónico de PaymentMethod
 * @module PaymentMethodResponse
 * @version 1.0.0
 */

import type { PaymentMethodConfigPrimitives } from '../../primitives';

export interface PaymentMethodResponse {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly status: string;
    readonly config: PaymentMethodConfigPrimitives;
    readonly displayOrder: number;
    readonly tenantId: string;
    readonly createdAt: Date;
    readonly createdBy: string | null;
    readonly updatedAt: Date | null;
    readonly updatedBy: string | null;
    readonly version: number;
}
