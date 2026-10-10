/**
 * @fileoverview DTO de respuesta para Layaway (apartado — lectura/sync).
 *
 * Espejo del agregado desktop Pittaj.Domain.Layaway.Layaway (ADR-007): documento propio.
 * Shape que ambos lados serializan/parsean: el desktop lo produce en su Describe (push) y lo
 * consume en ApplyLayawayAsync (pull); la nube lo emite desde LayawayResponseMapper. Las líneas
 * (lines[]) viven en la tabla hija layaway_lines y viajan anidadas en el DTO del padre.
 *
 * El desktop NO modela tenantId (lo estampa el backend por el JWT): no viaja.
 *
 * FOLIO: el AP-###### lo acuña quien crea el apartado (desktop = contador local; nube = contador
 * por tenant, count + 1 zero-pad 6 — el enum de docType de la casa no tiene LAYAWAY, así que NO
 * se usa document-series). La nube es RELAY del folio en el sync (no lo re-genera).
 *
 * `balance` es DERIVADO (total − paid): viaja para conveniencia de la web; el desktop lo ignora
 * al parsear (lo recomputa) y la nube lo ignora en el sync-push (fromPrimitives lo recalcula).
 *
 * @module Contracts/Layaway
 */

import type { LayawayStatusPrimitive } from '../primitives/layawayPrimitives.js';
import type { ImpuestosDelRenglonDeApartado } from '../impuestosDelRenglon.js';

/** Renglón de un apartado (entidad hija). Snapshot del precio al apartar. */
export interface LayawayLineResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    /** Cantidad apartada (> 0). */
    readonly quantity: number;
    /** Precio unitario del producto apartado. */
    readonly unitPrice: number;
    /** Importe del renglón: el total de venta con su snapshot (D7h1), o quantity × unitPrice. */
    readonly lineTotal: number;
    /** D7h1 · Snapshot fiscal del renglón (null en apartados anteriores). */
    readonly impuestos?: ImpuestosDelRenglonDeApartado | null;
}

/**
 * D7h · Un abono: el hecho de cada pago. Viaja en el sync en los dos sentidos: sin él la nube no
 * podía contabilizar ni facturar el anticipo, y el escritorio perdía los suyos al bajar.
 */
export interface LayawayPaymentResponse {
    readonly id: string;
    readonly amount: number;
    readonly paymentMethodId: string | null;
    readonly paymentMethodName: string | null;
    readonly sessionId: string | null;
    readonly operatorId: string | null;
    /** ISO 8601. */
    readonly occurredAt: string;
}

/** DTO de respuesta para consultas/sync de apartados. */
export interface LayawayResponse {
    readonly id: string;
    /** Folio AP-###### del documento de apartado. */
    readonly folio: string;
    /** Cliente del apartado (null = sin cliente; soft ref). */
    readonly customerId: string | null;
    /** Nombre del cliente en snapshot (null en apartados viejos o sin cliente). */
    readonly customerName: string | null;
    /** Estado: OPEN | COMPLETED | CANCELLED | EXPIRED. */
    readonly status: LayawayStatusPrimitive;
    // D7h1: un apartado COMPLETED ya es venta: su ticket lleva EL MISMO id que el apartado.
    /** Importe total del apartado (suma de los renglones). */
    readonly total: number;
    /** Abonado a la fecha (anticipos acumulados). */
    readonly paid: number;
    /** Saldo pendiente (derivado: total − paid). */
    readonly balance: number;
    /** Moneda (ej. "MXN"). */
    readonly currency: string;
    /** Operador que creó el apartado. Desde ADR-016 el operador ES el cajero. */
    readonly operatorId: string;
    /**
     * @deprecated Nombre viejo de `operatorId`. Se sigue emitiendo y leyendo durante el
     * despliegue escalonado (ADR-012: nada rompe en un solo salto) y se retira después,
     * cuando toda la flota esté en una versión que use `operatorId`.
     */
    readonly cashierId: string;
    /** Vencimiento del apartado (ISO 8601, null = sin vencimiento). */
    readonly dueDate: string | null;

    /** Renglones (tabla hija layaway_lines). */
    readonly lines: LayawayLineResponse[];
    /** D7h · Los abonos (en orden). Ausente en una nube anterior: el escritorio conserva los suyos. */
    readonly payments?: LayawayPaymentResponse[];

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
