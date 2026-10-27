/**
 * @fileoverview La venta sin caja como la leen la web y el escritorio.
 * @module Contracts/DirectSale
 */
import type { DirectSaleStatus, ImpuestoDeVentaSinCaja } from './ventaSinCaja.js';
import type { EstadoDelCfdiDeVentaSinCaja, OrigenDelCfdi } from './cfdi.js';

/** F3.2 · El comprobante de la venta, sin el XML. */
export interface DirectSaleCfdiResponse {
    readonly status: EstadoDelCfdiDeVentaSinCaja;
    readonly origin: OrigenDelCfdi;
    readonly uuid: string | null;
    readonly serie: string | null;
    readonly folio: string | null;
    readonly metodoPago: string | null;
    readonly formaPago: string | null;
    readonly issuerRfc: string | null;
    readonly receptorRfc: string | null;
    readonly stampedAt: string | null;
    /** Por qué falló el último intento de timbrar. */
    readonly error: string | null;
}

/** F3.2 · Resultado de timbrar o registrar. */
export interface DirectSaleCfdiResult {
    readonly status: 'stamped' | 'already-stamped' | 'registered' | 'failed' | 'blocked';
    readonly uuid: string | null;
    readonly message?: string;
}

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
    /** D1c · El IEPS del renglón (0 si no lleva), con su factor, tasa o cuota y clase. */
    readonly iepsAmount: number;
    readonly iepsFactor: 'Tasa' | 'Cuota' | null;
    readonly iepsRate: number | null;
    readonly iepsCategoria: string | null;
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
    /** D1c · Σ IEPS de los renglones. */
    readonly iepsAmount: number;
    /** D1c · Lo que el cliente retiene. */
    readonly isrWithheld: number;
    readonly ivaWithheld: number;
    /** Lo que el cliente paga: base + IVA + IEPS − retenciones (el `Total` del CFDI). */
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
    /** F3.2 · El CFDI vigente: null si no tiene. El XML se pide aparte (`…/xml`). */
    readonly cfdi: DirectSaleCfdiResponse | null;
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
