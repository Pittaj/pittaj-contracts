/**
 * @fileoverview DTO de SupplierNote (nota a proveedor) y del mapeo aprendido de CFDI.
 *
 * Espejo de `Pittaj.Domain.Purchasing.SupplierNote`. Tres documentos en uno:
 *
 * - `RETURN` — devolución de mercancía: renglones a costo, **saca stock** y reduce lo que se debe.
 * - `CREDIT` — nota de crédito o descuento posterior: monto manual, sin stock, reduce el saldo.
 * - `DEBIT`  — nota de débito o cargo: monto manual, sin stock, aumenta el saldo.
 *
 * Efecto **operativo, no fiscal**: la verdad fiscal vive en el CFDI del proveedor, cuyo UUID se
 * guarda aquí solo para conciliar.
 *
 * ── La nube NO mueve inventario ──
 * Cuando una devolución se aplica, el escritorio ya emitió la salida de stock y esa viaja por su
 * cuenta como `stock-movement`. Aplicarla otra vez al recibir la nota sacaría el doble.
 *
 * ── Importes verbatim ──
 * El monto del documento llega calculado y así se guarda. La nube no lo recompone a partir de los
 * renglones: para `CREDIT`/`DEBIT` ni siquiera hay renglones de dónde sacarlo.
 *
 * @module Contracts/SupplierNote
 */

/*
 * El tipo y el estado se definen UNA vez, en `supplierNoteState.ts`, junto a las transiciones que
 * los gobiernan. Aquí solo se reexportan.
 *
 * 🔴 Estaban declarados a mano en este archivo y la lista se quedó vieja: decía
 * `'DRAFT' | 'APPLIED' | 'CANCELLED'` cuando el camino largo ya añadía `AUTHORIZED` e
 * `IN_TRANSIT`. Una lista de estados en dos sitios es una lista de estados que se va a desfasar.
 */
export type { SupplierNoteKind, SupplierNoteStatus } from '../supplierNoteState.js';
import type { SupplierNoteKind, SupplierNoteStatus } from '../supplierNoteState.js';

/** Renglón de una devolución (solo en notas `RETURN`). */
export interface SupplierNoteLineResponse {
    readonly id: string;
    readonly productId: string;
    /** Snapshot del nombre al capturar la nota. */
    readonly productName: string;
    /** Snapshot del código/SKU al capturar la nota. */
    readonly productCode: string;

    readonly quantity: number;
    readonly unitCost: number;
    readonly discountPercent: number;
    readonly taxPercent: number;

    /**
     * La compra de la que sale ESTE renglón — no la cabecera, que es donde vivía.
     *
     * Una nota puede cubrir renglones de varias compras, porque el proveedor manda una sola nota de
     * crédito por tres facturas. Nulo = capturado a mano (salida de emergencia).
     */
    readonly purchaseId: string | null;
    readonly purchaseNumber: string | null;
    /** Renglón concreto de esa compra: contra él se cuenta lo ya devuelto. */
    readonly purchaseLineId: string | null;
    /** El costo al que entró en su compra origen. La salida se valúa con este, no con el promedio. */
    readonly unitCostSource: number | null;
    /** Motivo de este renglón, además del general de la nota. */
    readonly reason: string | null;

    readonly subtotalAmount: number;
    readonly discountAmount: number;
    readonly taxBaseAmount: number;
    readonly taxAmount: number;
    readonly totalAmount: number;
}

/** DTO de respuesta para sync de notas a proveedor. */
export interface SupplierNoteResponse {
    readonly id: string;
    /** Folio interno (NOTA-#). */
    readonly noteNumber: string;
    readonly kind: SupplierNoteKind;
    readonly status: SupplierNoteStatus;

    readonly supplierId: string;
    /** Snapshot del nombre del proveedor. */
    readonly supplierName: string;
    /** RFC snapshot; puede faltar si el proveedor se capturó sin él. */
    readonly supplierTaxId: string | null;

    /*
     * 🔴 Aquí ya NO hay `purchaseId` ni `purchaseNumber`: la referencia a la compra bajó al
     * renglón, porque una nota puede cubrir varias compras. Se leen de `lines[].purchaseNumber`.
     */

    /** Bodega de la que sale la mercancía (solo importa en `RETURN`). */
    readonly warehouseId: string;
    /** UUID del CFDI del proveedor, para conciliar. */
    readonly invoiceUuid: string | null;

    readonly currency: string;
    readonly reason: string | null;

    /**
     * Canje: la mercancía sale y el proveedor la repone. **No es un cuarto tipo.**
     *
     * Cambia dos cosas visibles: el efecto sobre lo que debes es **cero** y aparece una fecha de
     * reposición esperada.
     */
    readonly isExchange: boolean;
    readonly expectedReplacementDate: string | null;

    /** Folio de autorización del proveedor (RMA). Solo del camino largo. */
    readonly authorizationCode: string | null;
    readonly authorizationExpiresAt: string | null;
    /** Cuándo salió la mercancía (camino largo: se envía antes de acreditarse). */
    readonly shippedAt: string | null;

    /** Monto del documento. En `RETURN` sale de los renglones; en el resto se captura. */
    readonly amount: number;
    /** Impuesto; solo tiene sentido en `RETURN`. */
    readonly taxAmount: number;

    readonly appliedAt: string | null;
    readonly cancellationReason: string | null;
    readonly lines: readonly SupplierNoteLineResponse[];

    readonly version: number;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}

/**
 * DTO del mapeo **proveedor-concepto → producto** que se aprende al importar CFDIs.
 *
 * La primera factura de un proveedor se concilia a mano; de la segunda en adelante los conceptos
 * emparejan solos. Sincronizarlo importa porque ese aprendizaje es trabajo humano acumulado: sin
 * él, una computadora nueva vuelve a preguntar producto por producto en cada factura.
 */
export interface SupplierProductLinkResponse {
    readonly id: string;
    /** RFC del emisor en mayúsculas — clave estable aunque el proveedor no exista aún en el catálogo. */
    readonly supplierRfc: string;
    /** Clave del concepto: `ID:<NoIdentificacion>` si el CFDI lo trae, o `DESC:<descripción>`. */
    readonly conceptoKey: string;
    readonly productId: string;
    /** Última descripción vista (diagnóstico/UI). */
    readonly description: string;

    readonly version: number;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}
