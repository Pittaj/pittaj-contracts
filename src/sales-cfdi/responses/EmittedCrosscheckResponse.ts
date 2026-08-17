/**
 * @fileoverview Lo que devuelve el cruce de emitidos contra el SAT (fase 2).
 * @module Contracts/SalesCfdi
 */

import type { CrosscheckFindingKindValue } from '../schemas/emittedCrosscheck.schema.js';

/**
 * Un hallazgo: un UUID que no cuadra entre los dos lados.
 *
 * Los campos vienen **por pares** —`sat*` y `pittaj*`— y cualquiera de los dos grupos puede venir
 * en null: eso *es* el hallazgo. En `SOLO_EN_SAT` no hay lado nuestro; en `SOLO_EN_PITTAJ` no hay
 * lado del SAT. Enseñar los dos siempre, aunque uno esté vacío, es lo que hace que la pantalla no
 * tenga que explicar tres formatos distintos.
 */
export interface CrosscheckFindingResponse {
    readonly id: string;
    readonly kind: CrosscheckFindingKindValue;
    readonly year: number;
    readonly month: number;
    readonly uuid: string;

    /** Lo que dice el SAT. Null entero en `SOLO_EN_PITTAJ`. */
    readonly satTotal: number | null;
    readonly satRfcReceptor: string | null;
    readonly satNombreReceptor: string | null;
    readonly satFechaEmision: string | null;
    /** `Vigente` / `Cancelado`. Se enseña; **no** genera hallazgo (eso es la fase 1). */
    readonly satEstado: string | null;

    /** Lo que tenemos nosotros. Null entero en `SOLO_EN_SAT`. */
    readonly cfdiId: string | null;
    readonly pittajTotal: number | null;
    readonly pittajRfcReceptor: string | null;
    readonly serie: string | null;
    readonly folio: string | null;

    /** Cuándo se detectó por primera vez. **No** se reescribe al recruzar. */
    readonly firstSeenAt: string;
    /** Última pasada que lo volvió a ver. */
    readonly lastSeenAt: string;

    readonly reviewedAt: string | null;
    readonly reviewedBy: string | null;
    readonly reviewNote: string | null;
}

/**
 * Cómo salió el cruce de un mes.
 *
 * 🔴 **`satCount` y `pittajCount` se enseñan aunque no haya ni un hallazgo.** Un cruce que dice
 * «0 diferencias» sobre 0 filas del SAT no significa que todo esté bien: significa que no bajó
 * nada. Sin los dos totales a la vista, las dos cosas se leen igual.
 */
export interface CrosscheckPeriodResponse {
    readonly year: number;
    readonly month: number;
    /** Cuándo terminó la última pasada completa de este mes. */
    readonly crossedAt: string;
    /** Qué equipo subió la metadata. */
    readonly deviceId: string | null;
    readonly satCount: number;
    readonly pittajCount: number;
    readonly soloEnSat: number;
    readonly soloEnPittaj: number;
    readonly diferencias: number;
    /** De los tres anteriores, cuántos siguen sin marcar como revisados. */
    readonly pendingReview: number;
}

/** `GET /api/sales-cfdi/sat-crosscheck` */
export interface ListCrosscheckFindingsResponse {
    readonly items: readonly CrosscheckFindingResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
}

/** `GET /api/sales-cfdi/sat-crosscheck/periods` */
export interface ListCrosscheckPeriodsResponse {
    readonly items: readonly CrosscheckPeriodResponse[];
}

/**
 * Lo que contesta cada lote subido.
 *
 * Mientras `complete` sea `false` **no hay cruce y no hay resultado**: el lote se guardó y se está
 * esperando a los que faltan. La pantalla del escritorio necesita distinguir «va bien, siguen
 * faltando 3» de «terminó», porque las dos son respuestas 200.
 */
export interface PushSatEmittedMetadataResponse {
    readonly uploadId: string;
    readonly chunksReceived: number;
    readonly chunkCount: number;
    readonly rowsReceived: number;
    readonly complete: boolean;
    /** Solo cuando `complete` es `true`. */
    readonly period: CrosscheckPeriodResponse | null;
}
