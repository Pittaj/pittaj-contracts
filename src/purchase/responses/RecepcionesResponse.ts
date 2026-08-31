/**
 * @fileoverview La lista de entregas: el buzón de la bodega.
 * @module Contracts/Purchase/Responses/Recepciones
 *
 * ── Por qué esta lista no es la de compras ──
 *
 * Desde F5.1c una compra puede tener varias entregas, cada una con su fecha, su remisión y quién la
 * recibió. Dentro del documento se ven bien; lo que no se puede ver es **el día**: «qué llegó el
 * martes», que es la pregunta de quien está en la bodega y no en la oficina.
 *
 * Una compra sale **tantas veces como entregas tuvo**. Es justo lo contrario de la lista de
 * compras, y por eso las dos pantallas existen.
 */

/** Una entrega, con lo que hace falta para reconocerla sin abrir el documento. */
export interface RecepcionResponse {
    readonly id: string;
    readonly purchaseId: string;
    readonly purchaseNumber: string;
    readonly supplierName: string;

    readonly receivedAt: string;
    /**
     * Remisión o guía del proveedor. Nulo = entró sin papel.
     *
     * El que falta es el que después no deja conciliar el CFDI contra varias entregas, y por eso
     * se puede capturar tarde.
     */
    readonly remittance: string | null;
    readonly warehouseId: string;
    readonly warehouseName: string | null;
    readonly receivedBy: string | null;

    /** Cuántos renglones distintos trajo. */
    readonly lineCount: number;
    /** Cuántas piezas, sin contar los cargos del documento — un flete no son piezas. */
    readonly quantity: number;
    /**
     * Lo que valía lo que entró, a costo neto.
     *
     * **Derivado de sus renglones, no guardado** (§4). Es lo que convierte «llegaron 210 piezas»
     * en algo que se puede contrastar con lo que se va a pagar.
     */
    readonly amount: number;

    /** Apagada y con fecha si se revirtió. No desaparece: pasó ese día. */
    readonly reversedAt: string | null;
}

export interface GetRecepcionesResponse {
    readonly items: readonly RecepcionResponse[];
    /** Cuántas entregas en el rango, sin contar las revertidas. */
    readonly total: number;
    /** Suma de lo que entró, sin las revertidas. */
    readonly importeTotal: number;
    /** Cuántas entraron sin remisión: el papel que después no deja conciliar. */
    readonly sinRemision: number;
    /**
     * La última entrega registrada, sea del rango o no.
     *
     * Es la mitad del vacío bueno: un «no hay resultados» a secas deja sin saber si es que no llegó
     * nada o si el filtro está mal puesto, y esa duda se resuelve con un dato que ya está a mano.
     */
    readonly ultimaEntregaAt: string | null;
}
