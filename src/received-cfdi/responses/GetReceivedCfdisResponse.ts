/**
 * @fileoverview DTO de respuesta para el listado paginado del buzón.
 * @module Contracts/ReceivedCfdi
 */

import type { ReceivedCfdiResponse } from './ReceivedCfdiResponse.js';

/** Respuesta de GET /api/received-cfdis (lista paginada). */
export interface GetReceivedCfdisResponse {
    readonly items: ReceivedCfdiResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Cuántos hay en cada estado —y cuánto IVA suman— para los contadores y el tablero. */
    readonly counts: {
        readonly nuevos: number;
        readonly vinculados: number;
        readonly ignorados: number;
        /**
         * IVA trasladado de los comprobantes **sin capturar** (el «por confirmar» del tablero).
         *
         * 🔴 Se suma en el servidor sobre el tenant entero. El tablero del buzón lo sumaba sobre lo
         * cargado en la página, así que con más de una página el «IVA acreditable del mes» salía
         * corto — y la pantalla lo avisaba al pie, que es pedirle al usuario que desconfíe de la
         * cifra en vez de darle la buena. El escritorio siempre lo calculó del conjunto; esto es lo
         * que hace que los cuatro cajones coincidan de verdad en las dos plataformas.
         */
        readonly ivaNuevos: number;
        /** IVA trasladado de los ya capturados (el «confirmado» del tablero). */
        readonly ivaVinculados: number;
        /**
         * Cancelados en el SAT que YA se convirtieron en un documento nuestro.
         *
         * 🔴 Es el número más caro de la pantalla: dedujiste algo que el emisor borró. Venía
         * calculándose en el cliente filtrando los comprobantes **de la página cargada**, así
         * que con más de una página salía corto — el mismo defecto que se corrigió para las
         * sumas de IVA y que aquí quedó vivo justo donde más duele. Ahora lo cuenta el
         * servidor sobre todo el buzón.
         */
        readonly canceladosYCapturados: number;
        /** Comprobantes cuyo emisor aparece en la lista 69-B. Mismo caso: se contaba por página. */
        readonly deEmisoresEnEfos: number;
    };
}
