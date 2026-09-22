/**
 * @fileoverview Lo que se ve ANTES de fusionar, y lo que contesta la fusión.
 * @module Contracts/Product/Responses/MergeProducts
 *
 * La fusión es irreversible, así que el preview no es un adorno: es el único momento en que alguien
 * puede ver que está a punto de mezclar el huevo de Jalisco con el de Tehuacán. Por eso viaja
 * **contado**, no resumido: cuántas compras, cuántas ventas, cuánto hay en cada bodega.
 */

/** Lo que hay del duplicado en una bodega y que va a pasar al superviviente. */
export interface ExistenciaQueSeMueve {
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly quantity: number;
    /** Costo con el que entra al superviviente: el último del duplicado. */
    readonly unitCost: number;
}

/** Un montón de filas que van a cambiar de dueño, con su nombre en cristiano. */
export interface ReferenciasQueSeReapuntan {
    /** Cómo se llama en pantalla («Renglones de compra», «Ventas»…). */
    readonly que: string;
    readonly cuantas: number;
}

/** Lo que va a pasar si fusionas, resuelto antes de escribir nada. */
export interface MergeProductsPreviewResponse {
    readonly survivorId: string;
    readonly survivorName: string;
    readonly survivorCode: string | null;
    readonly survivorVersion: number;
    readonly duplicateId: string;
    readonly duplicateName: string;
    readonly duplicateCode: string | null;
    readonly duplicateVersion: number;
    /** Existencias del duplicado, bodega por bodega. Vacío = no hay nada que mover. */
    readonly existencias: readonly ExistenciaQueSeMueve[];
    /** Qué se re-apunta y cuánto, para que la cifra se vea antes de aceptar. */
    readonly referencias: readonly ReferenciasQueSeReapuntan[];
    /** El código de barras del duplicado, si el superviviente no tiene uno propio. */
    readonly codigoDeBarrasDisponible: string | null;
    /**
     * Motivos por los que esto **huele a error**: unidades base distintas, impuestos distintos,
     * los dos con existencias… No bloquean, se enseñan (quien fusiona sabe algo que el sistema no).
     */
    readonly avisos: readonly string[];
}

/** Lo que pasó de verdad. */
export interface MergeProductsResponse {
    readonly survivorId: string;
    readonly duplicateId: string;
    /** Cuántas filas cambiaron de dueño, por concepto. */
    readonly referencias: readonly ReferenciasQueSeReapuntan[];
    /**
     * En cuántas bodegas se sumó la existencia del duplicado a la del superviviente.
     *
     * No se postea ningún movimiento de traslado: el kárdex del duplicado se re-apunta entero, así
     * que su historia ya es la del superviviente y un movimiento extra contaría el saldo dos veces.
     */
    readonly existenciasSumadas: number;
    readonly codigoDeBarrasMovido: boolean;
}
