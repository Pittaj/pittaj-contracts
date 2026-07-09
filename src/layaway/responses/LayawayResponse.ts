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

import type { LayawayStatusPrimitive } from '../primitives/layawayPrimitives';

/** Renglón de un apartado (entidad hija). Snapshot del precio al apartar. */
export interface LayawayLineResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    /** Cantidad apartada (> 0). */
    readonly quantity: number;
    /** Precio unitario del producto apartado. */
    readonly unitPrice: number;
    /** Importe del renglón (quantity × unitPrice). */
    readonly lineTotal: number;
}

/** DTO de respuesta para consultas/sync de apartados. */
export interface LayawayResponse {
    readonly id: string;
    /** Folio AP-###### del documento de apartado. */
    readonly folio: string;
    /** Cliente del apartado (null = sin cliente; soft ref). */
    readonly customerId: string | null;
    /** Estado: OPEN | COMPLETED | CANCELLED | EXPIRED. */
    readonly status: LayawayStatusPrimitive;
    /** Importe total del apartado (suma de los renglones). */
    readonly total: number;
    /** Abonado a la fecha (anticipos acumulados). */
    readonly paid: number;
    /** Saldo pendiente (derivado: total − paid). */
    readonly balance: number;
    /** Moneda (ej. "MXN"). */
    readonly currency: string;
    /** Operador/cajero que creó el apartado. */
    readonly cashierId: string;
    /** Vencimiento del apartado (ISO 8601, null = sin vencimiento). */
    readonly dueDate: string | null;

    /** Renglones (tabla hija layaway_lines). */
    readonly lines: LayawayLineResponse[];

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
