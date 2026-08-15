/**
 * @fileoverview El historial de solicitudes al SAT, tal como lo leerá una pantalla.
 * @module Contracts/ReceivedCfdi
 *
 * 🆕 **Sin implementar todavía** — ni el endpoint ni el sync que lo llena.
 */

import type {
    SatDownloadRequestStatusValue,
    SatDownloadKindValue,
    SatDownloadPayloadValue,
} from '../schemas/satDownloadRequest.schema.js';

/** Una solicitud, con lo que hace falta para entender por qué el buzón está como está. */
export interface SatDownloadRequestResponse {
    readonly id: string;
    readonly deviceId: string;
    /** Nombre del equipo, para no enseñar un uuid a una persona. */
    readonly deviceName: string | null;
    readonly kind: SatDownloadKindValue;
    readonly payload: SatDownloadPayloadValue;
    readonly periodStart: string;
    readonly periodEnd: string;
    readonly status: SatDownloadRequestStatusValue;
    readonly satRequestId: string | null;
    readonly packageIds: readonly string[];
    /** Cuántas veces se le preguntó al SAT si ya estaba lista. Delata una que se quedó colgada. */
    readonly checkCount: number;
    /** Cuántos comprobantes trajo. Es la única cifra que dice si sirvió de algo. */
    readonly cfdiCount: number;
    readonly lastError: string | null;
    readonly requestedAt: string;
    readonly lastCheckedAt: string | null;
    readonly completedAt: string | null;
    /** `DESCARGADA`, `RECHAZADA` o `AGOTADA`: ya no va a cambiar sola. */
    readonly isFinal: boolean;
}

/**
 * `GET /api/sat-download-requests`.
 *
 * `exhaustedPeriods` va aparte porque **es la única cifra irreversible de esta pantalla**: cada una
 * es un periodo que ya no se puede volver a pedir. Enterrada entre los contadores de estado se
 * lee como un fallo más; arriba, es lo que evita que alguien reintente y queme la que queda.
 */
export interface ListSatDownloadRequestsResponse {
    readonly items: readonly SatDownloadRequestResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly counts: {
        readonly inFlight: number;
        readonly downloaded: number;
        readonly rejected: number;
        readonly exhaustedPeriods: number;
    };
}
