/**
 * @fileoverview Antigüedad de saldos: qué se debe, por venta, y desde cuándo.
 * @module Contracts/CustomerPayment
 *
 * Los tramos son los de siempre (corriente, 1-30, 31-60, 61-90, +90) porque son los que
 * usa quien cobra y los que espera ver un contador. Se calculan **contra la fecha de
 * corte**, no contra hoy.
 */

/** Una venta a crédito con saldo. */
export interface ReceivableResponse {
    readonly ticketId: string;
    readonly ticketNumber: string;
    readonly customerId: string;
    readonly customerName: string | null;
    readonly locationId: string | null;
    /** Fecha de la venta, ISO 8601. */
    readonly issuedAt: string;
    /** Días transcurridos desde la venta hasta la fecha de corte. */
    readonly ageDays: number;
    /** Total de la venta. */
    readonly total: number;
    /** Cobrado a la fecha de corte (suma de las aplicaciones vigentes). */
    readonly paid: number;
    /** Lo que se debe (total − paid). */
    readonly balance: number;
    /** CURRENT | D1_30 | D31_60 | D61_90 | D90_PLUS. */
    readonly bucket: ReceivableBucket;
}

export const RECEIVABLE_BUCKETS = ['CURRENT', 'D1_30', 'D31_60', 'D61_90', 'D90_PLUS'] as const;
export type ReceivableBucket = (typeof RECEIVABLE_BUCKETS)[number];

export interface GetReceivablesResponse {
    readonly items: readonly ReceivableResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Suma de saldos por tramo, sobre TODO el filtro — no solo la página. */
    readonly totals: Readonly<Record<ReceivableBucket, number>> & { readonly ALL: number };
}
