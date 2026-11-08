/**
 * @fileoverview Qué mueve el inventario una devolución a proveedor, y con qué id (2.81.0).
 * @module Contracts/SupplierNote
 *
 * **Espejo exacto en C#**: `SalidaDeLaNota` (Pittaj.Domain.Purchasing). Mismos casos en
 * `salidaDeLaNota.test.ts` y `SalidaDeLaNotaTests`.
 *
 * ── Por qué se cuenta lo que ya se movió ──
 *
 * La nube no tiene transacción entre la nota y el kárdex, y una devolución se puede aplicar en la web o
 * en el escritorio. Para que un reintento, o la otra punta, no saque la mercancía dos veces, lo que
 * se postea sale del **estado**: por producto, cuánto pide la nota menos lo que ya salió neto con su
 * folio (`PURCHASE_RETURN`). Ya fuera, no se vuelve a sacar; reabrir regresa todo lo neto.
 *
 * ── El id ──
 *
 * Determinista por nota, producto, dirección y **ronda**: lo regresado acumulado de ese producto.
 * Cada salida ocurre cuando lo salido es igual a lo regresado (todo está dentro), así que la entrada de
 * reabrir sabe a qué salida seguir (misma ronda) para regresar a sus lotes y series.
 */

const r4 = (n: number) => Math.round(n * 10_000) / 10_000;

export interface MovimientoDeNota {
    readonly productId: string;
    readonly direction: 'IN' | 'OUT';
    readonly quantity: number;
}

export interface PosteoDeNota {
    readonly productId: string;
    readonly direction: 'IN' | 'OUT';
    readonly quantity: number;
    /** Semilla del id del movimiento (`deterministicUuidV4` / `IdDeterminista.DeSemilla`). */
    readonly seed: string;
    /** La salida que sigue una entrada (para regresar a sus lotes y series); nulo en una salida. */
    readonly followsSeed: string | null;
}

/** La semilla del movimiento de una nota. */
export function semillaDeMovimientoDeNota(noteId: string, productId: string, direction: 'IN' | 'OUT', ronda: number): string {
    return `stock:supplier-note:${noteId}:${productId}:${direction}:${r4(ronda)}`;
}

/**
 * Lo que hay que postear para sacar (`OUT`: aplicar o enviar) o regresar (`IN`: reabrir) la mercancía
 * de una nota, por producto y en el orden de sus renglones. `movimientos` son los que ya existen con
 * el folio de la nota. Un producto ya fuera (o ya dentro) no vuelve a moverse.
 */
export function posteosDeLaNota(
    noteId: string,
    lineas: readonly { readonly productId: string; readonly quantity: number }[],
    movimientos: readonly MovimientoDeNota[],
    direction: 'IN' | 'OUT'
): PosteoDeNota[] {
    const pide = new Map<string, number>();
    for (const l of lineas) pide.set(l.productId, (pide.get(l.productId) ?? 0) + l.quantity);
    const out: PosteoDeNota[] = [];
    for (const [productId, cantidad] of pide) {
        const salio = movimientos.filter((m) => m.productId === productId && m.direction === 'OUT').reduce((s, m) => s + m.quantity, 0);
        const volvio = movimientos.filter((m) => m.productId === productId && m.direction === 'IN').reduce((s, m) => s + m.quantity, 0);
        const neto = r4(salio - volvio);
        const ronda = r4(volvio);
        if (direction === 'OUT') {
            if (neto > 0 || r4(cantidad) <= 0) continue;
            out.push({ productId, direction, quantity: r4(cantidad), seed: semillaDeMovimientoDeNota(noteId, productId, 'OUT', ronda), followsSeed: null });
        } else {
            if (neto <= 0) continue;
            out.push({
                productId,
                direction,
                quantity: neto,
                seed: semillaDeMovimientoDeNota(noteId, productId, 'IN', ronda),
                followsSeed: semillaDeMovimientoDeNota(noteId, productId, 'OUT', ronda),
            });
        }
    }
    return out;
}
