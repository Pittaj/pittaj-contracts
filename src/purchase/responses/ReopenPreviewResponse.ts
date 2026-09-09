/**
 * @fileoverview Qué le pasaría al inventario si se reabriera esta compra.
 * @module Contracts/Purchase/Responses
 *
 * GET /api/purchases/:id/reopen-preview — no escribe nada; solo contesta qué
 * mercancía de esta compra **ya salió**, para poder decirlo antes de reabrir.
 *
 * Espejo de `PreviewReopenQuery` del escritorio, y por el mismo motivo: reabrir
 * revierte la entrada de inventario, y hacerlo sin mirar si esa mercancía ya se
 * vendió deja la existencia en negativo **en silencio**. No lo impide —a veces es
 * justo lo que hay que hacer, porque la compra estaba mal capturada— pero lo dice
 * antes, no después.
 */

/** Un producto que quedaría en negativo al revertir la entrada. */
export interface NegativeStockWarning {
    readonly productId: string;
    readonly productName: string;
    /** La bodega de la entrega que se va a revertir (no siempre la de la compra). */
    readonly warehouseId: string;
    /** Existencia actual, en unidades BASE. */
    readonly onHand: number;
    /** Lo que se devolvería al revertir, en unidades BASE. */
    readonly toReverse: number;
    /** Existencia resultante. Negativa por definición: por eso está en la lista. */
    readonly resulting: number;
}

export interface ReopenPreviewResponse {
    /**
     * Solo los productos que quedarían en negativo. Vacío = reabrir no deja nada
     * por debajo de cero, que es el caso normal.
     */
    readonly warnings: NegativeStockWarning[];
}
