/**
 * @fileoverview «Qué reponer»: la pantalla del lunes por la mañana.
 * @module Contracts/Purchase/Responses/Reposicion
 *
 * No es una lista de documentos: es una **pantalla de trabajo**. Lo que se está acabando, cuánto se
 * vende, qué cuesta y quién lo deja mejor — con la cantidad sugerida ya escrita para que casi
 * siempre solo haya que pulsar.
 */

import type { UrgenciaDeReposicion } from '../reposicion.js';

/** Un producto que hay que reponer, con todo lo que hace falta para decidir. */
export interface ReposicionItemResponse {
    readonly productId: string;
    readonly productName: string;
    /** Código de barras o SKU, lo que el usuario reconoce. */
    readonly productCode: string | null;

    readonly existencia: number;
    readonly minimo: number;
    readonly puntoDeReorden: number;
    /** Lo que se vende en una semana, promediado sobre las últimas. */
    readonly ventaSemanal: number;
    /** Para cuántos días alcanza. Nulo si no se vende nada. */
    readonly diasQueAlcanza: number | null;
    readonly urgencia: UrgenciaDeReposicion;

    /** A quién se le compra normalmente: el último que lo surtió. */
    readonly supplierId: string | null;
    readonly supplierName: string | null;
    readonly diasDeEntrega: number;
    /** Lo que costó la última vez. Nulo si nunca se ha comprado. */
    readonly ultimoCosto: number | null;

    /** Piezas por unidad de compra. 1 = se compra por pieza. */
    readonly piezasPorCaja: number;
    /** Cuánto pedir, ya redondeado a la caja. */
    readonly cantidadSugerida: number;
    /** La cuenta en palabras: de dónde salen los 36 y no los 40. */
    readonly explicacion: string;
}

export interface GetReposicionResponse {
    readonly items: readonly ReposicionItemResponse[];
    /** Cuántos productos se están vigilando (los que tienen mínimo o reorden). */
    readonly vigilados: number;
    /**
     * Cuántos del catálogo **no tienen mínimo definido**.
     *
     * Es el número que decide si la pantalla sirve: un mínimo sin definir es una alerta que nunca
     * va a sonar, y con 340 productos sin mínimo esta lista no avisa de nada.
     */
    readonly sinMinimo: number;
    /** Lo que costaría comprar todo lo sugerido, al último costo conocido. */
    readonly importeSugerido: number;
}

/** Un mínimo y un máximo propuestos para un producto, desde lo que ya se vendió. */
export interface MinimoSugeridoResponse {
    readonly productId: string;
    readonly productName: string;
    readonly ventaSemanal: number;
    readonly diasDeEntrega: number;
    readonly minimoActual: number;
    readonly minimoSugerido: number;
    readonly maximoSugerido: number;
}

export interface GetMinimosSugeridosResponse {
    readonly items: readonly MinimoSugeridoResponse[];
    /** Sobre cuántas semanas de venta se calculó. */
    readonly semanasAnalizadas: number;
}
