/**
 * @fileoverview Tanda 3 de «Caja sin salir» · Notas de crédito que no cuadraban entre la nube y un equipo antes de C4.
 * @module Contracts/CreditNote
 *
 * Antes de C4 cada punta restaba el saldo sobre su copia y la última en subir pisaba a la otra. C4 convirtió lo ya
 * gastado de cada nota en un **uso heredado** con el mismo id en las dos puntas (`md5('credit-note-legacy-redemption:'
 * || id)`), y si las dos copias ya no cuadraban, cada una lo acuñó con su propio monto. Entra el primero que llega —el
 * de la nube, que corrió primero— y el del equipo se perdía en silencio. Desde 2.118.0 la nube lo anota: la
 * **divergencia** es ese uso con dos montos. Alguien decide cuál vale; el saldo sigue derivándose de los usos.
 */

import { z } from 'zod';

/** Qué monto del uso heredado vale: el de la nube (se confirma) o el del equipo (se corrige la nota). */
export const DecisionDeDivergencia = ['NUBE', 'EQUIPO'] as const;
export type DecisionDeDivergenciaValue = (typeof DecisionDeDivergencia)[number];

export const resolverDivergenciaSchema = z.object({
    decision: z.enum(DecisionDeDivergencia),
});
export type ResolverDivergenciaInput = z.infer<typeof resolverDivergenciaSchema>;

export const getDivergenciasSchema = z.object({
    /** Solo las que nadie ha resuelto (por omisión). `false` = también las resueltas. */
    pendientes: z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => v !== 'false'),
});

/** `GET /api/credit-notes/divergences` — una nota cuyo uso heredado no cuadraba. */
export interface DivergenciaDeNotaResponse {
    readonly id: string;
    readonly creditNoteId: string;
    readonly folio: string;
    readonly customerName: string | null;
    readonly importe: number;
    /** El uso heredado en la nube (el que entró). */
    readonly usadoEnLaNube: number;
    /** El que acuñó el equipo con su copia. */
    readonly usadoEnElEquipo: number;
    /** Saldo hoy en la nube. */
    readonly saldo: number;
    readonly detectedAt: string;
    readonly resolvedAt: string | null;
    readonly decision: DecisionDeDivergenciaValue | null;
}

/** Centavos: lo que separa un descuadre de un redondeo. */
const CENTAVO = 0.005;

/** ¿Los dos montos del mismo uso de verdad no cuadran? */
export function noCuadra(usadoEnLaNube: number, usadoEnElEquipo: number): boolean {
    return Math.abs(usadoEnLaNube - usadoEnElEquipo) >= CENTAVO;
}

/**
 * Lo que hay que registrar para «tomar la del equipo»: un uso de corrección por la diferencia. Solo existe cuando el
 * equipo había gastado **más** (un uso siempre resta). Si gastó menos, valer la del equipo es devolverle saldo al
 * cliente, y eso no es un uso: se emite una nota nueva por la diferencia. `null` = no se corrige con un uso.
 */
export function correccionParaTomarLaDelEquipo(usadoEnLaNube: number, usadoEnElEquipo: number): number | null {
    const diferencia = Math.round((usadoEnElEquipo - usadoEnLaNube) * 100) / 100;
    return diferencia > 0 ? diferencia : null;
}
