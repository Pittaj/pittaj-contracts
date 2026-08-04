/**
 * @fileoverview Response DTO canónico de PaymentMethod
 * @module PaymentMethodResponse
 * @version 1.0.0
 */

import type { PaymentMethodConfigPrimitives } from '../primitives/index.js';

export interface PaymentMethodResponse {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly status: string;
    readonly config: PaymentMethodConfigPrimitives;
    readonly displayOrder: number;
    /**
     * Clave SAT c_FormaPago ('01' efectivo, '03' transferencia, '04' tarjeta…).
     * Null = sin mapear. La usa Bancos para identificar métodos que liquidan por TPV.
     */
    readonly satFormaPago: string | null;
    /**
     * Cuenta de tesorería donde liquida este método (BankAccountId).
     * Campo DORMIDO hasta la app Bancos: hoy siempre null, sin FK.
     */
    readonly settlementAccountId: string | null;
    /**
     * Método gestionado por el sistema (defaults de Pittaj).
     * No se puede eliminar, solo desactivar.
     */
    readonly isSystemManaged: boolean;
    readonly tenantId: string;
    readonly createdAt: Date;
    readonly createdBy: string | null;
    readonly updatedAt: Date | null;
    readonly updatedBy: string | null;
    readonly version: number;
}
