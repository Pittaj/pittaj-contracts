/**
 * @fileoverview DTO de respuesta para CreditNote (nota de crédito — lectura/sync).
 *
 * Espejo del agregado desktop Pittaj.Domain.CreditNote.CreditNote (ADR-007): documento
 * propio de saldo a favor. Shape que ambos lados serializan/parsean: el desktop lo produce
 * en su Describe (push) y lo consume en ApplyCreditNoteAsync (pull); la nube lo emite desde
 * CreditNoteResponseMapper.
 *
 * Es un agregado PLANO (sin colecciones hijas): todos los campos viven en la propia fila.
 * El desktop NO modela tenantId (lo estampa el backend por el JWT): no viaja.
 *
 * FOLIO: el desktop acuña el folio (NC-######) desde un contador LOCAL al emitir la nota
 * en una devolución; la nube es RELAY y transporta el folio tal cual del doc sincronizado
 * (no lo genera). El único write nativo de la nube es redeem (redimir saldo).
 *
 * @module Contracts/CreditNote
 */

import type { CreditNoteStatusPrimitive } from '../primitives/creditNotePrimitives';

/** DTO de respuesta para consultas/sync de notas de crédito. */
export interface CreditNoteResponse {
    readonly id: string;
    /** Folio NC-###### (acuñado en el desktop, transportado por la nube). */
    readonly folio: string;
    /** Cliente asociado (null = nota al portador). */
    readonly customerId: string | null;
    /** Origen del saldo (ej. "RETURN"). */
    readonly originType: string;
    /** Documento origen (ej. folio de la devolución; null = sin origen). */
    readonly originDocId: string | null;
    /** Importe emitido originalmente. */
    readonly amount: number;
    /** Saldo disponible (decrece al redimir; 0 = agotada). */
    readonly balance: number;
    /** Moneda (ej. "MXN"). */
    readonly currency: string;
    /** Estado: ACTIVE | REDEEMED | EXPIRED | CANCELLED. */
    readonly status: CreditNoteStatusPrimitive;
    /** Vencimiento (ISO 8601; null = sin vencimiento). */
    readonly expiresAt: string | null;

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
