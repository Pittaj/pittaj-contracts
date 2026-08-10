/**
 * @fileoverview Qué forma de pago significa «fiado». Fuente única.
 * @module Contracts/Shared
 *
 * **Esto estaba copiado en siete sitios** —cobranza, contabilidad, el TPV, el CFDI, el web y dos
 * veces el escritorio— y la copia número siete la añadió el guardia de crédito de la nube. Cada
 * copia es una oportunidad de que un reporte diga que un cliente debe y otro diga que no.
 *
 * **Los nombres en español no son cortesía: son datos que existen.** El escritorio guardó los tipos
 * traducidos hasta el 2026-07-26 y esas filas siguen en la tabla. Mirar solo `CREDIT` dejaría fuera
 * deuda vieja que sí existe, y en cobranza eso significa no salir a cobrarla.
 *
 * **El escritorio no puede importar de aquí** (es C#): tiene su propia copia única en
 * `Pittaj.Domain/Shared/CreditPaymentTypes.cs`. Son dos, una por lenguaje, y es el mínimo — pero
 * si tocas una, toca la otra.
 */

/** Tipos de forma de pago que significan venta a crédito. */
export const CREDIT_PAYMENT_TYPES = ['CREDIT', 'CREDITO', 'CRÉDITO'] as const;

export type CreditPaymentType = (typeof CREDIT_PAYMENT_TYPES)[number];

/**
 * Si un tipo de forma de pago significa «fiado». Tolera minúsculas y nulos porque lo que llega de
 * la base y del sync no siempre viene normalizado.
 */
export function isCreditPaymentType(type: string | null | undefined): boolean {
    if (!type) return false;
    return (CREDIT_PAYMENT_TYPES as readonly string[]).includes(type.toUpperCase());
}
