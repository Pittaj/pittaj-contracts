/**
 * @fileoverview Estados derivados de la compra: los dos ejes.
 * @module Contracts/Purchase
 *
 * El estado guardado es solo DRAFT | ACTIVE | CANCELLED. Los dos ejes —por dónde
 * va la mercancía y por dónde va el papel— se DERIVAN de los tres contadores de
 * cada renglón (pedido/recibido/facturado), igual que «disponible» se deriva de
 * los movimientos. Un estado guardado se desincroniza el día que alguien revierte
 * una recepción y nadie se entera (§4 del mandato de paridad).
 *
 * Estas funciones viven en contracts por la misma razón que `purchaseMath`: las
 * usan el dominio de la nube y la web para pintar, y dos copias acaban siendo dos
 * verdades. Son funciones puras sobre los contadores.
 */

/** Eje de mercancía: comparar Σ recibido contra Σ pedido en los renglones. */
export const MERCHANDISE_STATES = [
    'UNRECEIVED',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'CLOSED_WITH_SHORTAGE',
] as const;
export type PurchaseMerchandiseState = (typeof MERCHANDISE_STATES)[number];

/** Eje de papel: comparar Σ facturado contra Σ recibido en los renglones. */
export const PAPER_STATES = ['UNINVOICED', 'PARTIALLY_INVOICED', 'INVOICED'] as const;
export type PurchasePaperState = (typeof PAPER_STATES)[number];

/** Lo que una compra necesita de cada renglón para derivar sus ejes. */
export interface PurchaseStateLine {
    /** Pedido (unidad de compra). */
    readonly quantity: number;
    /** Recibido acumulado (unidad de compra). */
    readonly qtyReceived: number;
    /** Facturado acumulado (unidad de compra). */
    readonly qtyInvoiced: number;
    /** True = «no se espera más de este renglón» (cerrado con faltante). */
    readonly closed: boolean;
}

/**
 * Eje de mercancía, derivado.
 *
 * - `UNRECEIVED` — nada recibido y nada cerrado.
 * - `PARTIALLY_RECEIVED` — algo recibido y queda pendiente abierto.
 * - `RECEIVED` — todo pedido está recibido.
 * - `CLOSED_WITH_SHORTAGE` — queda pendiente, pero está cerrado a propósito:
 *   no se espera más. Un renglón cerrado con faltante NO es «en parte»: ya no
 *   espera nada.
 *
 * Si conviven renglones recibidos al 100 % con renglones cerrados con faltante,
 * manda el faltante cerrado: es el dato que explica por qué el documento dejó
 * de moverse. Un renglón a medio recibir y además cerrado también es
 * `CLOSED_WITH_SHORTAGE` — el cierre es la última palabra del renglón.
 */
export function merchandiseState(lines: readonly PurchaseStateLine[]): PurchaseMerchandiseState {
    if (lines.length === 0) return 'UNRECEIVED';

    const anyClosedWithShortage = lines.some((l) => l.closed && l.qtyReceived < l.quantity);
    const anyPartiallyOpen = lines.some(
        (l) => !l.closed && l.qtyReceived > 0 && l.qtyReceived < l.quantity
    );
    const anyReceived = lines.some((l) => l.qtyReceived > 0);
    const allDone = lines.every((l) => l.qtyReceived >= l.quantity);

    if (anyClosedWithShortage) return 'CLOSED_WITH_SHORTAGE';
    if (allDone) return 'RECEIVED';
    if (anyPartiallyOpen || anyReceived) return 'PARTIALLY_RECEIVED';
    return 'UNRECEIVED';
}

/**
 * Eje de papel, derivado: Σ facturado contra Σ RECIBIDO.
 *
 * La referencia es lo recibido, no lo pedido: una factura cubre lo que el
 * proveedor entregó, y lo que nunca llegó no se factura (o se factura de más,
 * que es justo lo que la comparación de la conciliación detecta).
 */
export function paperState(lines: readonly PurchaseStateLine[]): PurchasePaperState {
    const totalReceived = lines.reduce((acc, l) => acc + l.qtyReceived, 0);
    const totalInvoiced = lines.reduce((acc, l) => acc + l.qtyInvoiced, 0);

    if (totalInvoiced <= 0) return 'UNINVOICED';
    if (totalInvoiced >= totalReceived) return 'INVOICED';
    return 'PARTIALLY_INVOICED';
}

/**
 * ¿Esta compra aún puede recibir mercancía?
 *
 * Un renglón admite recibir si queda pendiente ABIERTO (no cerrado). Es el
 * guarda que decide si el botón «Recibir» se dibuja encendido.
 */
export function hasOpenReceiving(lines: readonly PurchaseStateLine[]): boolean {
    return lines.some((l) => !l.closed && l.qtyReceived < l.quantity);
}

/** El pendiente abierto de un renglón (0 si está completo o cerrado). */
export function openReceiving(line: PurchaseStateLine): number {
    if (line.closed || line.qtyReceived >= line.quantity) return 0;
    return line.quantity - line.qtyReceived;
}
