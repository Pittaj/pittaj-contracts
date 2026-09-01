/**
 * @fileoverview Pedir precios a varios y comparar.
 * @module Contracts/Purchase/Responses/QuoteRequest
 */

import type { ComparacionDeCotizacion } from '../quoteComparison.js';

export const QUOTE_REQUEST_STATUSES = ['DRAFT', 'REQUESTING', 'CLOSED', 'CANCELLED'] as const;
export type QuoteRequestStatusType = (typeof QUOTE_REQUEST_STATUSES)[number];

export interface QuoteRequestLineResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    readonly quantity: number;
    /**
     * Lo que costó la última vez con cada proveedor, por si ayuda a leer el precio nuevo.
     *
     * Es lo que convierte la captura en un **detector de aumentos** sin pedirle nada al usuario.
     * Mapa `supplierId → último costo`; vacío si nunca se le compró ese producto.
     */
    readonly ultimoCostoPorProveedor: Readonly<Record<string, number>>;
}

export interface QuoteResponseLineResponse {
    readonly productId: string;
    readonly unitPrice: number;
}

export interface QuoteResponseResponse {
    readonly id: string;
    readonly supplierId: string;
    readonly supplierName: string;
    /** Nulo = sigue callado. */
    readonly respondedAt: string | null;
    readonly declined: boolean;
    readonly declinedReason: string | null;
    readonly validUntil: string | null;
    readonly deliveryDays: number | null;
    readonly paymentTerms: string | null;
    readonly note: string | null;
    readonly lines: readonly QuoteResponseLineResponse[];
}

export interface QuoteRequestResponse {
    readonly id: string;
    readonly requestNumber: string;
    readonly status: QuoteRequestStatusType;
    readonly neededBy: string | null;
    readonly note: string | null;
    readonly createdByName: string | null;
    readonly sentAt: string | null;
    readonly closedAt: string | null;
    readonly cancelledReason: string | null;
    readonly createdAt: string;

    readonly lines: readonly QuoteRequestLineResponse[];
    readonly responses: readonly QuoteResponseResponse[];

    /** Cuántos contestaron de cuántos se preguntó. La columna que se mira en la lista. */
    readonly contestaron: number;
    readonly invitados: number;
    /**
     * Alguna respuesta ya venció.
     *
     * **Derivado, no guardado**: sale de comparar la fecha de cada respuesta con hoy. Una
     * cotización vencida no es un dato viejo — es tener que volver a pedir precios y empezar de
     * cero.
     */
    readonly vencida: boolean;

    /** La comparación entera. Nula mientras nadie haya cotizado. */
    readonly comparacion: ComparacionDeCotizacion | null;
}

export interface GetQuoteRequestsResponse {
    readonly items: readonly QuoteRequestResponse[];
    /** Cuántas siguen esperando respuestas. */
    readonly pidiendoPrecios: number;
}

/** Lo que devuelve crear las órdenes desde la comparación. */
export interface CreatePurchasesFromQuoteResponse {
    readonly purchases: ReadonlyArray<{
        readonly id: string;
        readonly purchaseNumber: string;
        readonly supplierName: string;
        readonly total: number;
    }>;
}
