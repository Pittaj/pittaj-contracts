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

import type { PurchaseKindValue } from '../schemas/getPurchases.schema.js';

/**
 * Naturaleza del documento: INVENTORY (postea existencias), EXPENSE (gasto) o
 * FIXED_ASSET (se capitaliza y se deprecia).
 *
 * ⚠️ **Deriva de `PURCHASE_KINDS`, no se redefine.** Estaba escrito a mano como
 * `'INVENTORY' | 'EXPENSE'` y se quedó atrás cuando entró `FIXED_ASSET`: dos
 * definiciones del mismo enum y solo una actualizada. El sync de una compra de
 * activo fijo lo habría rechazado quien tipara contra este alias.
 */
export type PurchaseKind = PurchaseKindValue;

/**
 * Estado guardado de la compra.
 *
 * ⚠️ Dejó de ser lineal: lo que se guarda es solo Borrador / Vigente / Cancelada.
 * Los dos ejes (mercancía y papel) se DERIVAN de los contadores de cada renglón
 * (`merchandiseState` / `paperState`) y no se guardan. El valor heredado
 * `'RECEIVED'` ya no existe: una compra recibida es `ACTIVE` con contadores.
 */
export type PurchaseStatus = 'DRAFT' | 'ACTIVE' | 'CANCELLED';

/** Estado de aceptación del comprobante (acuse con plazo, LatAm). */
export const ACCEPTANCE_STATUSES = ['PENDING', 'ACCEPTED', 'CLAIMED'] as const;
export type AcceptanceStatus = (typeof ACCEPTANCE_STATUSES)[number];

/** Renglón de una compra (basado en costo). Snapshot del producto al comprar. */
export interface PurchaseLineResponse {
    readonly id: string;
    /**
     * Producto del catálogo, o `null` en un renglón **sin producto** (flete,
     * maniobras, servicio): el escritorio los permite desde siempre y la
     * descripción libre viaja en `productName`. Esos renglones no postean
     * inventario al recibir.
     *
     * ⚠️ Era `string` y la columna de la nube era `uuid NOT NULL`, así que el
     * escritorio mandaba `""` y el INSERT moría con *invalid input syntax for type
     * uuid* — **una compra con un renglón de flete no llegaba nunca a la nube**, y
     * en silencio, porque el push falla por renglón dentro de una respuesta 200.
     */
    readonly productId: string | null;
    readonly productName: string;
    readonly productCode: string;
    /** Pedido (cantidad en la UNIDAD DE COMPRA, como la factura: 2 bultos). */
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

    // --- Los tres contadores del ciclo de compra (F5.1c) ---
    /** Recibido acumulado, unidad de compra. Se suma/resta al recibir/revertir. */
    readonly qtyReceived: number;
    /** Facturado acumulado, unidad de compra. Lo mueve la conciliación de CFDI. */
    readonly qtyInvoiced: number;
    /**
     * Cargo del documento (flete, maniobras): no es un producto, se prorratea
     * al costo de los demás renglones (landed cost). Capa 3: el campo nace en
     * la migración; la pantalla se pospone.
     */
    readonly isDocumentCharge: boolean;
    /**
     * Cerrado con faltante: «no se espera más de este renglón». Es el que
     * explica por qué el documento dejó de estar abierto sin llegar a 100 %.
     */
    readonly closed: boolean;
}

/** Una entrega concreta de la compra: fecha, remisión, bodega y quién recibió. */
export interface PurchaseReceptionResponse {
    readonly id: string;
    readonly purchaseId: string;
    /** Fecha de la entrega (ISO 8601). */
    readonly receivedAt: string;
    /** Remisión o guía del proveedor (null = no la dio). */
    readonly remittance: string | null;
    /** Bodega donde entró la mercancía (soft ref). */
    readonly warehouseId: string;
    /** Quién recibió (nombre libre, como lo captura quien registra). */
    readonly receivedBy: string | null;
    /**
     * Cuándo se deshizo esta entrega (ISO 8601). Nulo = sigue en pie.
     *
     * ⚠️ Una entrega revertida **no desaparece**: se apaga y dice cuándo. El movimiento que la
     * deshace queda en el kárdex, así que esconderla obligaría a explicar por qué la existencia no
     * cuadra con la suma de entregas de la semana.
     */
    readonly reversedAt: string | null;
    /** Renglones de esta entrega. */
    readonly lines: readonly PurchaseReceptionLineResponse[];
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Versión para optimistic locking. */
    readonly version?: number;
}

/** Renglón de una recepción: la cantidad de ESA entrega. */
export interface PurchaseReceptionLineResponse {
    readonly id: string;
    /** Renglón de la compra al que suma. */
    readonly purchaseLineId: string;
    /** Cantidad recibida en esta entrega, unidad de compra. */
    readonly quantity: number;
    /** Costo con el que entró (neto por unidad de compra, sin impuestos). */
    readonly unitCost: number;
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
    /** Estado GUARDADO: DRAFT | ACTIVE | CANCELLED. Los ejes van aparte. */
    readonly status: PurchaseStatus;

    // --- Los dos ejes DERIVADOS (no se guardan) ---
    /** Eje de mercancía: sin recibir / en parte / recibida / cerrada con faltante. */
    readonly merchandiseState: import('../purchaseState.js').PurchaseMerchandiseState;
    /** Eje de papel: sin factura / en parte / facturada. */
    readonly paperState: import('../purchaseState.js').PurchasePaperState;

    // --- Datos mínimos del comprobante (CFDI del proveedor) ---
    readonly invoiceFolio: string | null;
    readonly invoiceUuid: string | null;
    /** Fecha del comprobante (ISO 8601, null = sin capturar). */
    readonly invoiceDate: string | null;

    /** Días de crédito que dio el proveedor, congelados al crear la compra. */
    readonly creditDays: number;
    /**
     * Fecha límite de pago (ISO). `null` = de contado: sin días de crédito o método PUE.
     *
     * Congelada en el documento a propósito: si colgara del proveedor, cambiarle las condiciones
     * movería los vencimientos de sus facturas viejas y la antigüedad de saldos cambiaría hacia
     * atrás.
     */
    readonly dueDate: string | null;
    /** Días de atraso a hoy. `0` si no ha vencido o si es de contado. **Derivado.** */
    readonly diasDeAtraso: number;
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

    /** Fecha de la última recepción (ISO 8601, null si ninguna). */
    readonly receivedAt: string | null;
    readonly cancellationReason: string | null;

    // --- Acuse con plazo (LatAm). Los campos nacen en la migración; la
    // pantalla se pospone a la capa 3. En México no se dibujan. ---
    /** Fecha en que se recibió el comprobante (ISO 8601, null = sin recibir). */
    readonly cfdiReceivedAt: string | null;
    /** PENDING | ACCEPTED | CLAIMED. PENDING = sin acusar. */
    readonly acceptanceStatus: AcceptanceStatus;
    /** Plazo para reclamar (ISO 8601, null = sin plazo / no aplica). */
    readonly acceptanceDeadline: string | null;

    /** Renglones (tabla hija purchase_lines). */
    readonly lines: PurchaseLineResponse[];

    /** Historial de recepciones (entregas concretas, reversibles una a una). */
    readonly receptions: PurchaseReceptionResponse[];

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
