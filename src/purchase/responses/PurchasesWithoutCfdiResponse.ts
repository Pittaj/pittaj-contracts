/**
 * @fileoverview Respuestas de la conciliación de CFDI y del cajón «compras sin CFDI».
 * @module Contracts/Purchase/Responses
 */

import type { PurchaseResponse } from './PurchaseResponse.js';

/** Resultado de conciliar un CFDI contra N compras. */
export interface ReconcileCfdiResponse {
    readonly purchases: readonly PurchaseResponse[];
    /** Compra a la que quedó vinculado el comprobante (la de mayor importe). */
    readonly linkedPurchaseId: string;
}

/**
 * El tercer cajón del tablero: compras recibidas sin comprobante.
 *
 * La cifra que se enseña no es el importe, es el **IVA en riesgo**: lo que se
 * pierde si el proveedor nunca factura. Es derivado, no guardado
 * (§4 del mandato).
 */
export interface PurchasesWithoutCfdiResponse {
    readonly items: readonly PurchaseResponse[];
    readonly total: number;
    /** Importe total pendiente de facturar (prorrateado por lo recibido). */
    readonly importePendiente: number;
    /** IVA que se deja de acreditar si el proveedor nunca factura. */
    readonly ivaEnRiesgo: number;
}
