/**
 * @fileoverview DTO de respuesta para Purchase (sync).
 *
 * Espejo del PurchaseDto desktop (Pittaj.Application/Purchasing/Dtos/PurchaseDto).
 * Shape que ambos lados serializan/parsean: el desktop lo produce en su Describe
 * (push) y lo consume en ApplyPurchaseAsync (pull); la nube lo emite desde
 * PurchaseResponseMapper. Los renglones (lines[]) viven en la tabla hija
 * purchase_lines y viajan anidados en el DTO del padre.
 *
 * @module Contracts/Purchase
 */

/** Naturaleza del documento: INVENTORY (postea existencias) o EXPENSE (gasto). */
export type PurchaseKind = 'INVENTORY' | 'EXPENSE';

/** Estado de la compra. BORRADOR → RECIBIDA | CANCELADA. */
export type PurchaseStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED';

/** Renglón de una compra (basado en costo). Snapshot del producto al comprar. */
export interface PurchaseLineResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string;
    /** Cantidad en la UNIDAD DE COMPRA (como la factura: 2 bultos). */
    readonly quantity: number;
    /** Costo por esa unidad de compra. */
    readonly unitCost: number;
    readonly discountPercent: number;
    /** Fracción 0-1 (0.16 = 16%). */
    readonly taxPercent: number;
    /** Unidad de compra (null = base). */
    readonly unitName: string | null;
    /** Unidades base por 1 de la unidad de compra (bulto = 25 kg → 25). Base = 1. */
    readonly unitFactor: number;
    /** Cantidad en unidad BASE (para stock): cantidad × factor. */
    readonly baseQuantity: number;
    readonly subtotalAmount: number;
    readonly discountAmount: number;
    /** Base gravable: subtotal − descuento. */
    readonly taxBaseAmount: number;
    readonly taxAmount: number;
    readonly totalAmount: number;
}

/** DTO de respuesta para consultas/sync de compras. */
export interface PurchaseResponse {
    readonly id: string;
    /** Folio interno (COMP-#). */
    readonly purchaseNumber: string;
    readonly supplierId: string;
    /** Snapshot del proveedor al comprar. */
    readonly supplierName: string;
    /** RFC snapshot (null = sin capturar). */
    readonly supplierTaxId: string | null;
    /** Bodega destino de la entrada. */
    readonly warehouseId: string;
    /** Sucursal de la compra (null = general). */
    readonly locationId: string | null;
    readonly kind: PurchaseKind;
    readonly status: PurchaseStatus;

    // --- Datos mínimos del comprobante (CFDI del proveedor) ---
    readonly invoiceFolio: string | null;
    readonly invoiceUuid: string | null;
    /** Fecha del comprobante (ISO 8601, null = sin capturar). */
    readonly invoiceDate: string | null;
    /** CFDI MétodoPago: "PUE" / "PPD". */
    readonly paymentMethod: string | null;
    /** CFDI FormaPago: "01" efectivo, "03" transferencia, … */
    readonly paymentForm: string | null;
    /** CFDI UsoCFDI del receptor: "G01" mercancías, "G03" gastos, … */
    readonly usoCfdi: string | null;

    // --- Impuestos desglosados del comprobante (contabilidad) ---
    readonly trasladoIva: number;
    readonly trasladoIeps: number;
    readonly retencionIsr: number;
    readonly retencionIva: number;

    readonly currency: string;
    readonly notes: string | null;

    readonly subtotalAmount: number;
    readonly discountAmount: number;
    readonly taxAmount: number;
    readonly totalAmount: number;

    /** Fecha de recepción (ISO 8601, null si no recibida). */
    readonly receivedAt: string | null;
    readonly cancellationReason: string | null;

    /** Renglones (tabla hija purchase_lines). */
    readonly lines: PurchaseLineResponse[];

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
