/**
 * @fileoverview Pagos a proveedor y la cartera por pagar.
 */

import type {
    ClaveDeCubeta,
    FormaDePago,
    OrigenDePago,
    TipoDeDocumentoPagable,
} from '../cuentasPorPagar.js';

/** Un pedazo del pago, aplicado a un documento. */
export interface AplicacionDePagoResponse {
    readonly id: string;
    readonly documentType: TipoDeDocumentoPagable;
    readonly documentId: string;
    /** Folio con el que se aplicó. Snapshot del momento del pago. */
    readonly documentNumber: string;
    readonly amount: number;
}

export interface SupplierPaymentResponse {
    readonly id: string;
    readonly paymentNumber: string;
    readonly supplierId: string;
    readonly supplierName: string;
    /** ISO. La fecha que declara quien paga, no la de captura. */
    readonly paidAt: string;
    readonly currency: string;
    readonly amount: number;
    readonly paymentForm: FormaDePago;
    readonly reference: string | null;
    readonly origin: OrigenDePago;
    readonly bankAccountId: string | null;
    /** Movimiento bancario con el que se concilió. `null` = todavía no. */
    readonly bankTransactionId: string | null;
    readonly posSessionId: string | null;
    readonly notes: string | null;

    /** `null` = vigente. Un pago no se borra: se revierte. */
    readonly reversedAt: string | null;
    readonly reversedReason: string | null;

    readonly applications: readonly AplicacionDePagoResponse[];
    /** Lo repartido entre documentos. **Derivado.** */
    readonly aplicado: number;
    /** Lo que quedó sin documento: el anticipo. **Derivado.** */
    readonly sinAplicar: number;

    readonly createdAt: string;
    readonly version: number;
}

export interface GetSupplierPaymentsResponse {
    readonly items: readonly SupplierPaymentResponse[];
    readonly total: number;
}

/** Un documento que debe dinero. */
export interface DocumentoPorPagarResponse {
    readonly documentType: TipoDeDocumentoPagable;
    readonly documentId: string;
    readonly documentNumber: string;
    readonly supplierId: string;
    readonly supplierName: string;
    readonly currency: string;
    /** ISO. Fecha del documento. */
    readonly fecha: string;
    /** ISO. `null` = de contado. */
    readonly dueDate: string | null;

    readonly total: number;
    /**
     * Efecto de las notas: negativo en devolución y crédito, positivo en débito.
     *
     * Se enseña **aparte y no restado del total**: un renglón que no cuadra con la factura que el
     * proveedor tiene sobre la mesa, y que no explica por qué, es un renglón que nadie se cree.
     */
    readonly notas: number;
    readonly pagado: number;
    /** `total + notas − pagado`. **Derivado, nunca guardado.** */
    readonly saldo: number;

    readonly diasDeAtraso: number;
    readonly cubeta: ClaveDeCubeta;
}

export interface GetCuentasPorPagarResponse {
    readonly items: readonly DocumentoPorPagarResponse[];
    readonly total: number;
    /** Lo que se debe en total, de lo que trae esta consulta. */
    readonly saldoTotal: number;
    /** Cuánto de eso ya venció. */
    readonly saldoVencido: number;
}

/** Una fila de la antigüedad de saldos: un proveedor con su deuda repartida por cubeta. */
export interface AntiguedadDeProveedorResponse {
    readonly supplierId: string;
    readonly supplierName: string;
    readonly currency: string;
    readonly porVencer: number;
    readonly d1a30: number;
    readonly d31a60: number;
    readonly d61a90: number;
    readonly mas90: number;
    readonly total: number;
}

export interface GetAntiguedadResponse {
    /**
     * Una lista por moneda.
     *
     * **No se mezclan**: sumar pesos con dólares da un número que no existe, y es el error clásico
     * de este reporte.
     */
    readonly items: readonly AntiguedadDeProveedorResponse[];
    readonly totales: readonly AntiguedadDeProveedorResponse[];
}
