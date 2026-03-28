/**
 * @fileoverview Response para métodos de pago activos en TPV
 * @module ActiveForPosResponse
 * @version 1.0.0
 */

import type { PaymentMethodResponse } from './PaymentMethodResponse';

export interface ActiveForPosResponse {
    readonly items: PaymentMethodResponse[];
    readonly total: number;
}
