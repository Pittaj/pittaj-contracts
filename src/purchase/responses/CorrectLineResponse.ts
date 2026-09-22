/**
 * @fileoverview Lo que contesta «Corregir producto», y lo que se ve ANTES de corregir.
 * @module Contracts/Purchase/Responses/CorrectLine
 */

import type { PurchaseResponse } from './PurchaseResponse.js';

/** Otra compra que arrastra el mismo emparejamiento equivocado: la franja «otras N compras». */
export interface CompraConElMismoError {
    readonly purchaseId: string;
    readonly purchaseNumber: string;
    readonly lineId: string;
    readonly date: string | null;
    /** Cantidad en unidad de compra y su equivalente en base (lo que se movería). */
    readonly quantity: number;
    readonly quantityBase: number;
    readonly version: number;
    /** Ya recibida: corregirla mueve inventario. */
    readonly recibida: boolean;
}

/**
 * Lo que va a pasar si corriges, resuelto antes de escribir nada: es lo que llena el diálogo.
 */
export interface CorrectLinePreviewResponse {
    readonly purchaseId: string;
    readonly purchaseNumber: string;
    readonly lineId: string;
    /** Lo que dice el renglón hoy. */
    readonly productId: string | null;
    readonly productName: string;
    /** De dónde salió (para explicar el error): «por memoria de X», «por código de barras»… */
    readonly origin: string | null;
    readonly originDetail: string | null;
    readonly originAt: string | null;
    /** El texto del CFDI que emparejó mal, si lo hay. */
    readonly conceptoKey: string | null;
    readonly descripcionCfdi: string | null;
    readonly supplierRfc: string | null;
    readonly supplierName: string | null;
    /** Lo recibido de este renglón: si es > 0, corregir mueve inventario. */
    readonly qtyReceived: number;
    readonly qtyReceivedBase: number;
    readonly unitCostBase: number;
    readonly warehouseId: string;
    /** El alias que se reescribiría con `scope: DESDE_AHORA` (null = no hay memoria que tocar). */
    readonly aliasId: string | null;
    /** El renglón emparejó por código de barras: se ofrece moverlo al producto correcto. */
    readonly porCodigoDeBarras: boolean;
    readonly codigoDeBarras: string | null;
    /** Las otras compras con el mismo emparejamiento desde que se aprendió. */
    readonly otrasCompras: readonly CompraConElMismoError[];
}

export interface CorrectLineResponse {
    readonly purchase: PurchaseResponse;
    /** Cuántas compras se corrigieron en total (esta incluida). */
    readonly corregidas: number;
    /** Cuántos movimientos de inventario se postearon (salida + entrada por compra recibida). */
    readonly movimientos: number;
    /** La memoria quedó reescrita (`DESDE_AHORA`) u olvidada (`SOLO_ESTA`). */
    readonly memoria: 'REESCRITA' | 'OLVIDADA' | 'SIN_CAMBIO';
    readonly codigoDeBarrasMovido: boolean;
}
