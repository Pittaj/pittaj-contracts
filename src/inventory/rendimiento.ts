/**
 * @fileoverview U-T5 · Merma sin pesar mermas: rendimiento aprendido y existencia vendible.
 *
 * En el mostrador no se pesa cada recorte. Lo que sí se sabe: lo que entró (la factura), lo que se
 * vendió (la báscula de la caja) y, de vez en cuando, cuánto quedó de verdad («Se acabó» → cero;
 * «Pesar lo que queda» → lo que marca la báscula). La diferencia de ese cierre es la merma, y el
 * cociente vendido ÷ (vendido + merma) es el **rendimiento**: cuánto de lo que entra se vende.
 * Espejo: `Rendimiento.cs` (escritorio), mismos casos.
 */

/** Un movimiento del kárdex, como lo necesita el rendimiento. */
export interface MovimientoParaRendimiento {
    readonly direction: 'IN' | 'OUT';
    /** SALE · RETURN · PURCHASE · MERMA · ADJUSTMENT · COUNT · … */
    readonly sourceType: string;
    readonly quantity: number;
}

export interface Rendimiento {
    /** Vendido neto (ventas − devoluciones), en la base. */
    readonly vendido: number;
    /** Merma reconocida (salidas MERMA), en la base. */
    readonly merma: number;
    /** vendido ÷ (vendido + merma), 0–1 con cuatro decimales. Nulo si aún no hay merma reconocida. */
    readonly rendimiento: number | null;
}

const r4 = (n: number) => Math.round(n * 10000) / 10000;

/**
 * El rendimiento del periodo. Sin ningún cierre («Se acabó» / «Pesar lo que queda») no hay merma
 * reconocida y no se puede saber: devuelve nulo en vez de un 100 % que no es cierto.
 */
export function rendimientoAprendido(movimientos: readonly MovimientoParaRendimiento[]): Rendimiento {
    let vendido = 0;
    let merma = 0;
    for (const m of movimientos) {
        if (m.sourceType === 'SALE') vendido += m.direction === 'OUT' ? m.quantity : -m.quantity;
        else if (m.sourceType === 'RETURN' && m.direction === 'IN') vendido -= m.quantity;
        else if (m.sourceType === 'MERMA' && m.direction === 'OUT') merma += m.quantity;
    }
    vendido = Math.max(0, vendido);
    return {
        vendido: r4(vendido),
        merma: r4(merma),
        rendimiento: merma > 0 && vendido + merma > 0 ? r4(vendido / (vendido + merma)) : null,
    };
}

/** Lo que de lo que hay se va a poder vender, con el rendimiento aprendido. Sin él, lo que hay. */
export function existenciaVendibleEstimada(existencia: number, rendimiento: number | null): number {
    if (!(existencia > 0)) return 0;
    return rendimiento == null ? existencia : r4(existencia * rendimiento);
}

/**
 * «Pesar lo que queda» (o «Se acabó» = 0): el ajuste que cierra el ciclo. Lo que falta es merma
 * (sale como MERMA); si sobra —la báscula marcó más de lo que el sistema creía— entra como
 * corrección, no como merma negativa.
 */
export function cierrePorPesaje(teorica: number, pesada: number): { readonly merma: number; readonly sobrante: number } {
    const p = Math.max(0, pesada);
    return teorica > p ? { merma: r4(teorica - p), sobrante: 0 } : { merma: 0, sobrante: r4(p - teorica) };
}

/** GET /api/stock-items/rendimiento?productId= — el rendimiento de los últimos 180 días y lo vendible. */
export interface RendimientoDelProductoResponse extends Rendimiento {
    readonly productId: string;
    /** Desde cuándo se mide (`YYYY-MM-DD`). */
    readonly desde: string;
    /** Existencia de hoy, en la base, de todas las bodegas. */
    readonly existencia: number;
    /** Lo que de esa existencia se espera vender con el rendimiento aprendido. */
    readonly vendibleEstimada: number;
}
