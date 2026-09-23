/**
 * @fileoverview Lo que se ve ANTES de fusionar proveedores, y lo que contesta la fusión.
 * @module Contracts/Supplier/Responses/MergeSuppliers
 */

/** Un montón de filas que van a cambiar de dueño, con su nombre en cristiano. */
export interface ReferenciasDeProveedor {
    readonly que: string;
    readonly cuantas: number;
}

/** Lo que va a pasar si fusionas, resuelto antes de escribir nada. */
export interface MergeSuppliersPreviewResponse {
    readonly survivorId: string;
    readonly survivorName: string;
    readonly survivorCode: string | null;
    readonly survivorTaxId: string | null;
    readonly survivorVersion: number;
    readonly duplicateId: string;
    readonly duplicateName: string;
    readonly duplicateCode: string | null;
    readonly duplicateTaxId: string | null;
    readonly duplicateVersion: number;
    /** Qué se re-apunta y cuánto, contado, para que la cifra se vea antes de aceptar. */
    readonly referencias: readonly ReferenciasDeProveedor[];
    /**
     * Motivos por los que esto **huele a error** (RFC distintos, alias que se quedan…). No
     * bloquean: quien fusiona sabe algo que el sistema no.
     */
    readonly avisos: readonly string[];
}

/** Lo que pasó de verdad. */
export interface MergeSuppliersResponse {
    readonly survivorId: string;
    readonly duplicateId: string;
    readonly referencias: readonly ReferenciasDeProveedor[];
}
