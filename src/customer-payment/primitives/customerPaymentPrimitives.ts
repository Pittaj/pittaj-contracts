/**
 * @fileoverview Primitivas de la cobranza de ventas a crédito.
 * @module Contracts/CustomerPayment/Primitives
 *
 * Se podía vender fiado y **no había documento que registrara que el cliente pagó**: la
 * cuenta de Clientes crecía y no bajaba nunca. Esto es ese documento.
 *
 * **El cobro se aplica a VENTAS, no a un saldo global.** Podría bastar con restarle al saldo
 * del cliente, pero entonces el **REP** (Complemento de Pago, obligatorio en las ventas PPD)
 * no se podría emitir bien: el SAT lo pide por comprobante, con su parcialidad, su saldo
 * anterior y su saldo insoluto. Un saldo global no sabe contestar ninguna de las tres.
 *
 * **Este documento nace en la nube.** El escritorio todavía no lo tiene (la deuda se crea allá,
 * al vender a crédito; el cobro se captura aquí). No viaja por sync mientras eso siga así.
 */

/** Estados de un cobro. Un cobro no se edita ni se borra: se cancela. */
export const CUSTOMER_PAYMENT_STATUSES = ['APPLIED', 'CANCELLED'] as const;

/** Estado del cobro. Solo un APPLIED se puede cancelar. */
export type CustomerPaymentStatusPrimitive = (typeof CUSTOMER_PAYMENT_STATUSES)[number];

/**
 * Contra qué venta se aplicó una parte del cobro.
 *
 * `taxAmount` es la parte del importe que es IVA y **se congela al cobrar**: el IVA en
 * México se causa por flujo, y de un abono parcial se causa la parte proporcional (art. 1-B
 * de la Ley del IVA). Recalcularla después —cuando el ticket ya pudo recibir una devolución—
 * daría un número distinto para un impuesto que ya se declaró.
 */
export interface CustomerPaymentApplicationPrimitives {
    readonly id: string;
    /**
     * Qué clase de documento se abonó.
     *
     * **No siempre es un ticket:** un pedido entregado y sin pagar también es deuda y también se
     * cobra. Una columna que se llamara `ticketId` y a veces guardara un pedido mentiría sobre a
     * qué se abonó, y esa mentira acaba en un reporte de antigüedad.
     */
    readonly documentType: 'TICKET' | 'SALES_ORDER';
    /** Documento que se abona (`posTickets.id` o `salesOrders.id`). */
    readonly documentId: string;
    /** Folio del documento, copiado para leer el cobro sin volver a él. */
    readonly documentNumber: string | null;
    /** Cuánto de este cobro se aplicó a ese documento. Siempre > 0. */
    readonly amount: number;
    /** Cuánto de ese importe es IVA. Congelado al cobrar. */
    readonly taxAmount: number;
}

/** El documento de cobranza completo. */
export interface CustomerPaymentPrimitives {
    readonly id: string;
    /** Folio COB-###### del documento. */
    readonly folio: string;
    readonly customerId: string;
    /** Sucursal donde se cobró. De ella sale la empresa (RFC) a cuyo libro va el asiento. */
    readonly locationId: string | null;
    /** Importe cobrado. Igual a la suma de sus aplicaciones. */
    readonly amount: number;
    readonly paymentMethodId: string | null;
    readonly paymentMethodName: string | null;
    /** CASH | CARD | TRANSFER | WALLET | OTHER. Nunca CREDIT. */
    readonly paymentMethodType: string | null;
    /** Sesión de caja, si se cobró en el punto de venta. */
    readonly sessionId: string | null;
    /** Referencia externa: transferencia, autorización de terminal, folio del depósito. */
    readonly reference: string | null;
    readonly notes: string | null;
    readonly status: CustomerPaymentStatusPrimitive;
    /** Cuándo pagó el cliente, ISO 8601. Es la fecha contable, no la de captura. */
    readonly occurredAt: string;
    readonly operatorId: string | null;
    readonly cancelledAt: string | null;
    readonly cancelledReason: string | null;
    readonly applications: readonly CustomerPaymentApplicationPrimitives[];
}
