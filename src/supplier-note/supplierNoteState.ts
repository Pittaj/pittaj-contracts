/**
 * @fileoverview Lo que se DERIVA de una nota a proveedor y de lo que se le compró.
 * **Espejo exacto del escritorio** (`Pittaj.Domain/Purchasing/SupplierNoteState.cs`).
 * @module Contracts/SupplierNote
 *
 * ── Por qué vive aquí ──
 *
 * Mismo motivo que `purchaseState` y `purchaseMath`: son cuentas que hacen **las dos puntas y las
 * dos pantallas**. «Cuánto queda por devolver» se pinta en la pantalla de origen, se valida al
 * capturar y se vuelve a comprobar al aplicar; si cada sitio la calculara por su cuenta, el número
 * que se enseña y el que se exige acabarían siendo distintos, y el usuario vería un renglón en
 * verde que el servidor rechaza.
 *
 * ── Las dos reglas que sostiene este archivo ──
 *
 * 1. **«Cuánto queda por devolver» se calcula, no se guarda.** Es lo recibido menos lo ya devuelto,
 *    derivado de los movimientos (§4 del mandato de paridad). Un contador guardado se desincroniza
 *    el día que alguien reabre una nota — y reabrir ahora se puede.
 * 2. **El canje no mueve el saldo.** No te van a abonar, te van a reponer. Es una marca sobre la
 *    devolución, no un cuarto tipo.
 */

import { roundHalfEven } from '../purchase/purchaseMath.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Tipos y estados
// ─────────────────────────────────────────────────────────────────────────────

/** RETURN saca stock y baja lo que debes; CREDIT baja el saldo sin stock; DEBIT lo sube. */
export const SUPPLIER_NOTE_KINDS = ['RETURN', 'CREDIT', 'DEBIT'] as const;
export type SupplierNoteKind = (typeof SUPPLIER_NOTE_KINDS)[number];

/**
 * Los cinco estados. `AUTHORIZED` e `IN_TRANSIT` son del **camino largo**, que un negocio activa
 * solo si lo necesita; el corto sigue siendo `DRAFT → APPLIED | CANCELLED`.
 */
export const SUPPLIER_NOTE_STATUSES = [
    'DRAFT',
    'AUTHORIZED',
    'IN_TRANSIT',
    'APPLIED',
    'CANCELLED',
] as const;
export type SupplierNoteStatus = (typeof SUPPLIER_NOTE_STATUSES)[number];

/**
 * Qué transiciones admite cada estado.
 *
 * 🔴 `APPLIED` **ya no es terminal**: era `[]`, y un error de cantidad no tenía salida. Se reabre
 * como una compra recibida.
 *
 * `IN_TRANSIT` y `APPLIED` **no admiten cancelar**: la mercancía ya salió, así que primero se
 * reabre y la reversa del inventario queda registrada en vez de desaparecer con el documento.
 */
export const SUPPLIER_NOTE_TRANSITIONS: Readonly<Record<SupplierNoteStatus, readonly SupplierNoteStatus[]>> = {
    DRAFT: ['APPLIED', 'AUTHORIZED', 'CANCELLED'],
    AUTHORIZED: ['IN_TRANSIT', 'DRAFT', 'CANCELLED'],
    IN_TRANSIT: ['APPLIED', 'DRAFT'],
    APPLIED: ['DRAFT'],
    CANCELLED: [],
};

export function canTransition(from: SupplierNoteStatus, to: SupplierNoteStatus): boolean {
    return (SUPPLIER_NOTE_TRANSITIONS[from] ?? []).includes(to);
}

/** ¿La mercancía ya salió del almacén? Decide si se puede cancelar o hay que reabrir primero. */
export function stockAlreadyLeft(status: SupplierNoteStatus): boolean {
    return status === 'IN_TRANSIT' || status === 'APPLIED';
}

/** Solo la devolución mueve existencias. Crédito y débito son puro dinero. */
export function movesStock(kind: SupplierNoteKind): boolean {
    return kind === 'RETURN';
}

/**
 * Efecto firmado sobre el saldo por pagar. **Positivo = debes más.**
 *
 * 🔴 Un **canje da cero**, y esa es la razón de que esta función exista en vez de un `kind ===
 * 'DEBIT' ? a : -a` repartido por ahí: la mercancía sale pero el proveedor la repone, así que no
 * hay nada que abonar. Si el canje contara como abono, el reporte de cuentas por pagar diría que el
 * proveedor te debe un dinero que nunca te va a dar.
 */
export function payableEffect(
    kind: SupplierNoteKind,
    amount: number,
    isExchange: boolean = false
): number {
    if (isExchange && kind === 'RETURN') return 0;
    return kind === 'DEBIT' ? amount : -amount;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Cuánto queda por devolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lo que hace falta de un renglón comprado para saber cuánto queda por devolver.
 *
 * La referencia es lo **recibido**, no lo pedido: no se puede devolver algo que nunca llegó.
 */
export interface ReturnableSourceLine {
    /** Recibido de ese renglón de compra, en unidad de compra. */
    readonly qtyReceived: number;
    /** Ya devuelto contra ese renglón, sumando las notas que cuentan (ver `countsAgainstStock`). */
    readonly qtyReturned: number;
}

/** Cuánto queda por devolver. Nunca negativo: un dato torcido no debe leerse como crédito. */
export function returnableQuantity(line: ReturnableSourceLine): number {
    const disponible = (line.qtyReceived ?? 0) - (line.qtyReturned ?? 0);
    return disponible > 0 ? roundHalfEven(disponible, 4) : 0;
}

/** Ya no queda nada por devolver de este renglón. La pantalla lo atenúa y no deja teclear. */
export function isExhausted(line: ReturnableSourceLine): boolean {
    return returnableQuantity(line) <= 0;
}

/**
 * ¿Una nota en este estado descuenta de lo disponible para devolver?
 *
 * Cuenta desde que está **autorizada**, no desde que se aplica: en el camino largo la mercancía
 * está comprometida con el proveedor aunque todavía no haya salido, y ofrecerla otra vez llevaría a
 * prometer dos veces las mismas cajas. Un borrador no cuenta —todavía no es nada— y una cancelada
 * deja de contar.
 */
export function countsAgainstStock(status: SupplierNoteStatus): boolean {
    return status === 'AUTHORIZED' || status === 'IN_TRANSIT' || status === 'APPLIED';
}

/** Por qué una cantidad a devolver no vale. */
export type ReturnQuantityProblem =
    | { readonly kind: 'NOT_POSITIVE' }
    | { readonly kind: 'EXCEEDS'; readonly available: number };

/**
 * Valida una cantidad a devolver contra lo disponible. `null` = está bien.
 *
 * Se usa en los dos sitios a propósito: la pantalla la llama al teclear, y el dominio al aplicar.
 * Que sea la misma función es lo que evita que la pantalla deje pasar algo que el servidor rechaza.
 */
export function validateReturnQuantity(
    quantity: number,
    line: ReturnableSourceLine
): ReturnQuantityProblem | null {
    if (!(quantity > 0)) return { kind: 'NOT_POSITIVE' };

    const disponible = returnableQuantity(line);
    if (quantity > disponible) return { kind: 'EXCEEDS', available: disponible };

    return null;
}

/**
 * El mensaje que ve la persona, ya redactado.
 *
 * Vive aquí y no en cada pantalla porque el criterio de aceptación pide que **diga el número**
 * —«solo quedan 2 por devolver»— y porque la misma frase tiene que salir en las dos plataformas.
 * Dos redacciones del mismo rechazo se leen como dos reglas distintas.
 */
export function describeReturnProblem(
    problem: ReturnQuantityProblem,
    productName: string
): string {
    if (problem.kind === 'NOT_POSITIVE') {
        return `Captura cuántas piezas de «${productName}» devuelves.`;
    }
    if (problem.available <= 0) {
        return `De «${productName}» ya no queda nada por devolver.`;
    }
    const piezas = formatQuantity(problem.available);
    return `De «${productName}» solo ${problem.available === 1 ? 'queda' : 'quedan'} ${piezas} por devolver.`;
}

/**
 * Cantidad para un mensaje: sin decimales cuando es entera.
 *
 * «solo quedan 2 por devolver» y no «2.0000», que es lo que sale de una columna `numeric(14,4)` y
 * hace dudar de si el sistema está contando bien.
 */
export function formatQuantity(quantity: number): string {
    // `String(2)` ya da «2» y `String(2.5)` da «2.5». El espejo en C# necesita el formato
    // explícito `0.####` porque un `decimal` recuerda su escala y saldría «2.0000».
    return String(roundHalfEven(quantity, 4));
}
