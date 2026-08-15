/**
 * @fileoverview Lo que contestan las rutas del CFDI emitido de una venta.
 * @module Contracts/SalesCfdi
 *
 * Fiel a lo desplegado hoy, con **una diferencia deliberada de tipo**: donde el backend devuelve
 * `Date`, aquí va `string` ISO. Es lo que de verdad viaja por HTTP — el `JSON.stringify` ya las
 * convirtió— y tipar `Date` en el cliente miente: `new Date(x)` sobre algo que ya es `Date` pasa
 * el compilador y `.toISOString()` de un string revienta en ejecución.
 */

import type {
    SaleCfdiStatusValue,
    CancellationMotiveValue,
    RepPaymentFormValue,
} from '../schemas/saleCfdi.schema.js';

/** Un complemento de pago timbrado sobre la venta. */
export interface RepResponse {
    readonly id: string;
    readonly uuid: string | null;
    readonly status: SaleCfdiStatusValue;
    /** Número de parcialidad: 1 el primer abono, 2 el segundo… */
    readonly partiality: number;
    readonly amount: number;
    readonly paymentForm: RepPaymentFormValue | string;
    readonly paymentDate: string;
    /** Lo que quedaba a deber **después** de este abono. */
    readonly remainingBalance: number;
}

/**
 * `GET /api/sales-cfdi/:ticketId` — el estado del comprobante de una venta.
 *
 * `exists: false` con todo lo demás vacío es la respuesta normal de una venta sin facturar: no es
 * un 404, porque preguntar por el CFDI de un ticket que no lo tiene es una pregunta legítima que
 * hace la pantalla al abrir.
 */
export interface SaleCfdiStatusResponse {
    readonly exists: boolean;
    readonly status: SaleCfdiStatusValue | null;
    readonly uuid: string | null;
    readonly serie: string | null;
    readonly folio: string | null;
    readonly stampedAt: string | null;
    readonly cancelledAt: string | null;
    /** Por qué falló el último intento. Lo lee una persona, así que viaja tal cual. */
    readonly lastError: string | null;
    readonly hasXml: boolean;
    readonly hasPdf: boolean;
    /** La venta es a crédito (método PPD): aplica el complemento de pago. */
    readonly isPpd: boolean;
    /** Lo que queda a deber. `null` si no aplica (venta de contado). */
    readonly pendingBalance: number | null;
    readonly reps: readonly RepResponse[];
}

/**
 * Resultado de timbrar.
 *
 * 🔴 **Contesta 200 aunque no se haya podido timbrar**, y el `status` es quien lo dice. La razón
 * está en el propio backend: quien pidió la factura necesita **leer el motivo**, y un 4xx haría
 * que el cliente HTTP tirara el cuerpo con la explicación. Una pantalla que decida por el código
 * HTTP dirá «facturado» sobre un fallo.
 */
export interface StampSaleCfdiResponse {
    readonly status: 'stamped' | 'already-stamped' | 'failed';
    readonly uuid?: string | null;
    readonly serie?: string | null;
    readonly folio?: string | null;
    /** Mensaje para la persona. */
    readonly message?: string | null;
    /** Lo que dijo el PAC, para soporte. */
    readonly error?: string | null;
}

/** Resultado de cancelar ante el SAT. Mismo criterio del 200: el `status` manda. */
export interface CancelSaleCfdiResponse {
    readonly status: 'cancelled' | 'not-found' | 'not-stamped' | 'failed';
    readonly motive?: CancellationMotiveValue | null;
    readonly substitutionUuid?: string | null;
    readonly cancelledAt?: string | null;
    readonly error?: string | null;
}

/** Resultado de timbrar o cancelar un complemento de pago. */
export interface StampRepResponse {
    readonly status: 'stamped' | 'failed';
    readonly repId?: string | null;
    readonly uuid?: string | null;
    readonly partiality?: number | null;
    readonly message?: string | null;
    readonly error?: string | null;
}

export interface CancelRepResponse {
    readonly status: 'cancelled' | 'not-found' | 'failed';
    readonly error?: string | null;
}

/**
 * `GET /api/sales-cfdi/:ticketId/cancellation-status` — el estatus **vivo** en el PAC.
 *
 * No es lo mismo que `cancelledAt` de nuestra base: una cancelación con aceptación del receptor
 * queda *en proceso* durante días. `unknown` significa que el PAC no contestó, y hay que
 * enseñarlo como tal en vez de traducirlo a «vigente» — que sería inventar.
 */
export interface CancellationStatusResponse {
    readonly status: 'unknown' | string;
    readonly detail: string | null;
}

/** Resultado de emitir la factura global del periodo. */
export interface StampGlobalCfdiResponse {
    readonly status: 'stamped' | 'nothing-to-stamp' | 'failed';
    readonly cfdiId?: string | null;
    readonly uuid?: string | null;
    /** Cuántos tickets quedaron amparados por la global. */
    readonly ticketCount?: number | null;
    readonly total?: number | null;
    readonly message?: string | null;
    readonly error?: string | null;
}

/**
 * `GET /api/sales-cfdi/global/:globalId/tickets` — qué tickets ampara una factura global.
 *
 * Es la respuesta a *«¿esta venta de $80 sin RFC está facturada?»*, que de otro modo no tiene
 * respuesta: el ticket no guarda el UUID de la global, la global guarda la lista de tickets.
 */
export interface GlobalCfdiTicketsResponse {
    readonly cfdiId: string;
    readonly uuid: string | null;
    readonly from: string;
    readonly to: string;
    readonly tickets: readonly {
        readonly ticketId: string;
        readonly folio: string | null;
        readonly soldAt: string;
        readonly total: number;
    }[];
}
