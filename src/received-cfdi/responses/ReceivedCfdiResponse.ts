/**
 * @fileoverview DTO del buzón de comprobantes recibidos (sync y consulta).
 *
 * Espejo del agregado `ReceivedCfdi` del escritorio. Shape que ambos lados
 * serializan/parsean: el desktop lo produce en su `Describe` (push) y lo consume en
 * `ApplyReceivedCfdiAsync` (pull); la nube lo emite desde su mapper.
 *
 * **El escritorio manda.** Los comprobantes los baja él del SAT, porque es donde vive
 * la e.firma; la nube es un espejo de solo lectura para la web y para Contabilidad.
 *
 * @module Contracts/ReceivedCfdi
 */

import type {
    ReceivedCfdiStatusValue,
    ReceivedCfdiOriginValue,
    ReceivedCfdiLinkKindValue,
} from '../schemas/receivedCfdi.schema.js';

export interface ReceivedCfdiResponse {
    readonly id: string;
    /** Folio fiscal. Es la identidad del comprobante y el candado contra duplicados. */
    readonly uuid: string;

    readonly issuerRfc: string;
    readonly issuerName: string;
    readonly issuerRegime: string | null;
    readonly receiverRfc: string;

    /** Serie del emisor. Opcional en CFDI 4.0. */
    readonly series: string | null;
    /**
     * Folio del emisor. **Opcional y no garantizado único** — hay emisores (los bancos,
     * señaladamente) que reutilizan folios. Sirve para avisar, nunca para bloquear.
     */
    readonly folio: string | null;

    /** Fecha de emisión (ISO 8601, null = el XML no la traía). */
    readonly issuedAt: string | null;
    readonly currency: string | null;
    /** CFDI MétodoPago: "PUE" / "PPD". */
    readonly metodoPago: string | null;
    /** CFDI FormaPago: "01" efectivo, "03" transferencia, … */
    readonly formaPago: string | null;
    readonly usoCfdi: string | null;

    readonly subtotal: number;
    readonly total: number;
    readonly trasladoIva: number;
    readonly trasladoIeps: number;
    readonly retencionIsr: number;
    readonly retencionIva: number;

    readonly status: ReceivedCfdiStatusValue;
    readonly origin: ReceivedCfdiOriginValue;

    /**
     * El XML tal cual llegó, sin reformatear.
     *
     * Viaja entero por decisión del dueño (2026-08-11): el comprobante ES el documento
     * fiscal, y guardarlo solo en la máquina del cliente dejaría a la web sin poder
     * mostrarlo ni reimprimirlo, y a Contabilidad sin poder releerlo con un parser mejor.
     * Tope en `RECEIVED_CFDI_MAX_XML_BYTES`.
     */
    readonly xml: string;

    readonly linkedDocumentId: string | null;
    readonly linkedDocumentKind: ReceivedCfdiLinkKindValue | null;
    /** ISO 8601. */
    readonly linkedAt: string | null;
    readonly ignoredReason: string | null;

    /** Cuándo entró al buzón (no cuándo se emitió). ISO 8601. */
    readonly receivedAt: string;

    /**
     * Cuándo lo canceló el emisor en el SAT, si lo hizo. ISO 8601.
     *
     * **Ortogonal al estado**: un comprobante cancelado puede seguir VINCULADO, y ese es
     * precisamente el caso que hay que poder ver.
     */
    readonly cancelledAtSat: string | null;

    readonly version: number;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}
