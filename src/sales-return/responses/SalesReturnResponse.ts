/**
 * @fileoverview DTO de respuesta para SalesReturn (devolución — lectura/sync).
 *
 * Espejo del agregado desktop Pittaj.Domain.SalesReturn.SalesReturn (ADR-007): documento
 * de egreso propio ligado al ticket origen. Shape que ambos lados serializan/parsean: el
 * desktop lo produce en su Describe (push) y lo consume en ApplySalesReturnAsync (pull);
 * la nube lo emite desde SalesReturnResponseMapper. Las líneas (lines[]) viven en la tabla
 * hija sales_return_lines y viajan anidadas en el DTO del padre.
 *
 * El desktop NO modela tenantId (lo estampa el backend por el JWT): no viaja.
 *
 * FOLIO: el DEV-###### lo acuña quien crea la devolución (desktop = contador local; nube =
 * document-series assign-folio con fallback a contador por tenant). La nube es RELAY del
 * folio en el sync (no lo re-genera). El folio NC-###### de la nota de crédito enlazada
 * (creditNoteId) lo acuña quien procesa la devolución.
 *
 * @module Contracts/SalesReturn
 */

import type { ReturnResolutionPrimitive } from '../primitives/salesReturnPrimitives';

/** Renglón de una devolución (entidad hija). Snapshot del producto devuelto. */
export interface SalesReturnLineResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    /** Cantidad devuelta (> 0). */
    readonly quantity: number;
    /** Precio unitario del producto devuelto. */
    readonly unitPrice: number;
    /** Importe del renglón (quantity × unitPrice). */
    readonly lineTotal: number;
    /** true = la línea reingresa a inventario (movimiento IN/RETURN). */
    readonly restock: boolean;
}

/** DTO de respuesta para consultas/sync de devoluciones. */
export interface SalesReturnResponse {
    readonly id: string;
    /** Folio DEV-###### del documento de devolución. */
    readonly folio: string;
    /** Ticket de venta origen (null = devolución sin ticket ligado). */
    readonly originTicketId: string | null;
    /** Motivo de la devolución (texto libre). */
    readonly reason: string;
    /** Resolución del importe: CASH | CREDIT_NOTE. */
    readonly resolution: ReturnResolutionPrimitive;
    /** Importe total de la devolución (suma de los renglones). */
    readonly totalAmount: number;
    /** Moneda (ej. "MXN"). */
    readonly currency: string;
    /** Operador/cajero que procesó la devolución. */
    readonly cashierId: string;
    /** Nota de crédito emitida (id) cuando resolution = CREDIT_NOTE (null en CASH). */
    readonly creditNoteId: string | null;

    /** Renglones (tabla hija sales_return_lines). */
    readonly lines: SalesReturnLineResponse[];

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
