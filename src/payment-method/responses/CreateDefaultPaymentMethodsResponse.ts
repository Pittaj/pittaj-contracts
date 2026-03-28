/**
 * @fileoverview Response de creación de métodos de pago por defecto
 * @module CreateDefaultPaymentMethodsResponse
 * @version 1.0.0
 */

import type { PaymentMethodResponse } from './PaymentMethodResponse';

/**
 * Response con el total creado y los items.
 *
 * @since 1.0.0
 */
export interface CreateDefaultPaymentMethodsResponse {
    readonly created: number;
    readonly items: PaymentMethodResponse[];
}
