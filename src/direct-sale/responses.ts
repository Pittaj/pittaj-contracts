/**
 * @fileoverview La venta sin caja como la leen la web y el escritorio.
 * @module Contracts/DirectSale
 */
import type { DirectSaleStatus, ImpuestoDeVentaSinCaja } from './ventaSinCaja.js';

export interface DirectSaleLineResponse {
    readonly id: string;
    readonly position: number;
    readonly productId: string | null;
    readonly description: string;
    readonly satProductCode: string;
    readonly satUnitCode: string;
    readonly unitName: string | null;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly discountPercent: number;
    readonly tax: ImpuestoDeVentaSinCaja;
    /** El snapshot del impuesto, igual que el renglón del ticket: lo lee el timbrado. */
    readonly taxCode: string | null;
    readonly taxFactor: string | null;
    readonly taxPercent: number;
    readonly taxIncluded: boolean;
    readonly subtotal: number;
    readonly discount: number;
    /** La venta neta del renglón (y la base de su IVA). */
    readonly base: number;
    readonly taxAmount: number;
    readonly total: number;
    readonly businessLineId: string | null;
}

export interface DirectSaleResponse {
    readonly id: string;
    /** `VSC-000001`. */
    readonly folio: string;
    readonly status: DirectSaleStatus;
    readonly customerId: string;
    readonly customerName: string | null;
    readonly locationId: string;
    readonly businessLineId: string | null;
    /** `YYYY-MM-DD`: la fecha contable y de la que sale la antigüedad. */
    readonly issueDate: string;
    readonly dueDate: string | null;
    readonly reference: string | null;
    readonly notes: string | null;
    readonly subtotal: number;
    readonly discount: number;
    readonly base: number;
    readonly taxAmount: number;
    readonly total: number;
    /** Cobrado por cobros vigentes. Derivado, nunca guardado. */
    readonly paid: number;
    /** Lo que se debe: `total − paid` (0 si está cancelada). */
    readonly balance: number;
    readonly lines: readonly DirectSaleLineResponse[];
    readonly createdBy: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly cancelledAt: string | null;
    readonly cancelledReason: string | null;
    /** Obligatorio: viaja en el pull del escritorio, que lo lee con `GetProperty("version")`. */
    readonly version: number;
}

export interface GetDirectSalesResponse {
    readonly items: readonly DirectSaleResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}

/** Pull del escritorio: la venta sin caja baja para que su saldo cuente en el crédito del cliente. */
export interface SyncPullDirectSaleResponse {
    readonly changes: readonly DirectSaleResponse[];
    readonly lastSyncedAt: Date | string;
    readonly hasMore: boolean;
}
