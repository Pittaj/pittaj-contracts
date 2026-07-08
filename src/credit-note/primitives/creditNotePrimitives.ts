/**
 * @fileoverview Primitivas del dominio Nota de Crédito (saldo a favor).
 * @module Contracts/CreditNote/Primitives
 *
 * Espejo del agregado desktop Pittaj.Domain.CreditNote.CreditNote (ADR-007): documento
 * propio (no líneas negativas de un ticket). Se emite desde una devolución y se redime
 * como pago en una venta futura. Fuente única de los valores de enum del dominio.
 */

/** Estados de la nota de crédito (espejo de CreditNoteStatus del desktop). */
export const CREDIT_NOTE_STATUSES = ['ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED'] as const;

/** Estado de la nota de crédito. Solo las ACTIVE se pueden redimir. */
export type CreditNoteStatusPrimitive = (typeof CREDIT_NOTE_STATUSES)[number];
