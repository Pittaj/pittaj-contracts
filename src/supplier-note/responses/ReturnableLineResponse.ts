/**
 * @fileoverview Lo que se le compró a un proveedor y aún se puede devolver.
 * @module Contracts/SupplierNote/Responses
 *
 * Alimenta la **pantalla de origen**, que es el corazón del módulo: antes de abrir el editor eliges
 * proveedor y ves lo que le compraste, con lo que ya le devolviste descontado. No se busca el
 * producto a mano — así no se puede devolver algo que nunca compraste, en cantidad mayor a la
 * comprada, ni a un costo que no era.
 */

/** Un renglón comprado, con su disponible y su costo de entrada. */
export interface ReturnableLineResponse {
    readonly purchaseId: string;
    readonly purchaseNumber: string;
    readonly purchaseLineId: string;
    /** Cuándo entró la mercancía. ISO 8601. */
    readonly receivedAt: string | null;
    readonly locationId: string | null;

    readonly productId: string;
    readonly productName: string;
    readonly productCode: string;

    /** Lo que de verdad entró. La referencia NO es lo pedido: no se devuelve lo que no llegó. */
    readonly qtyReceived: number;
    /** Lo ya devuelto contra este renglón. */
    readonly qtyReturned: number;
    /**
     * Lo que queda por devolver.
     *
     * **Derivado, no guardado** (§4 del mandato): es `qtyReceived − qtyReturned`, calculado con
     * `returnableQuantity`. Un contador guardado se desincroniza el día que alguien reabre una
     * nota — y reabrir ahora se puede.
     */
    readonly qtyReturnable: number;

    /**
     * El costo al que entró en ESA compra. Es el que hereda el renglón de la devolución y **no se
     * puede editar**: es el *exact cost reversing* de Business Central.
     */
    readonly unitCost: number;
    readonly discountPercent: number;
    readonly taxPercent: number;
}

/** GET /api/supplier-notes/returnable */
export interface GetReturnableLinesResponse {
    readonly items: readonly ReturnableLineResponse[];
    /** Cuántos productos distintos se le compraron en el periodo. Es el pie de la pantalla. */
    readonly productCount: number;
    /** Cuántas compras distintas aparecen. Hace visible que una nota puede cubrir varias. */
    readonly purchaseCount: number;
}
