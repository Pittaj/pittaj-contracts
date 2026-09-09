/**
 * @fileoverview DTO de respuesta para el listado paginado de compras.
 * @module Contracts/Purchase
 */

import type { PurchaseResponse } from './PurchaseResponse.js';

/** Respuesta de GET /api/purchases (lista paginada). */
export interface GetPurchasesResponse {
    readonly items: PurchaseResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /**
     * Suma de los totales de **todo lo filtrado**, no de la página.
     *
     * Es la diferencia entre «cuánto llevo comprado a este proveedor este mes» y «cuánto
     * suman los cincuenta documentos que caben en pantalla». La segunda pregunta no la
     * hace nadie, y sumar en el cliente solo sabe contestar esa.
     */
    readonly filteredAmount: number;
}
