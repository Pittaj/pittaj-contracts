/**
 * @fileoverview U-T5 · Merma sin pesar mermas: rendimiento aprendido y existencia vendible.
 *
 * En el mostrador no se pesa cada recorte. Lo que sí se sabe: lo que entró (la factura), lo que se
 * vendió (la báscula de la caja) y, de vez en cuando, cuánto quedó de verdad («Se acabó» → cero;
 * «Pesar lo que queda» → lo que marca la báscula). La diferencia de ese cierre es la merma, y el
 * cociente vendido ÷ (vendido + merma) es el **rendimiento**: cuánto de lo que entra se vende.
 * Espejo: `Rendimiento.cs` (escritorio), mismos casos.
 */

import type { YieldRow, YieldTotals } from './responses/InventoryReportsResponse.js';
import type { AlertaDerivada } from './schemas/inventoryAlert.schema.js';
import { idDeAlerta } from './schemas/inventoryAlert.schema.js';

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

/** GET /api/inventory/rendimiento/:id — el rendimiento de los últimos 180 días y lo vendible. */
export interface RendimientoDelProductoResponse extends Rendimiento {
    readonly productId: string;
    /** Desde cuándo se mide (`YYYY-MM-DD`). */
    readonly desde: string;
    /** Existencia de hoy, en la base, de todas las bodegas. */
    readonly existencia: number;
    /** Lo que de esa existencia se espera vender con el rendimiento aprendido. */
    readonly vendibleEstimada: number;
}

// ── U-T6 · Reporte, alerta y costo por unidad vendida ───────────────────────────────────────

/** El rendimiento mínimo por omisión: debajo de esto se avisa. */
export const RENDIMIENTO_MINIMO_POR_OMISION = 0.85;

/**
 * El costo de lo que de verdad se vende: si de cada kilo que entra se venden 0.85, cada kilo
 * vendido cargó 1 ÷ 0.85 kilos comprados. Es el costo contra el que hay que poner precio.
 */
export function costoPorUnidadVendida(costo: number, rendimiento: number | null): number {
    if (rendimiento == null || !(rendimiento > 0)) return costo;
    return Math.round((costo / rendimiento) * 10000) / 10000;
}

/** Un movimiento del periodo con su producto y categoría, para el reporte YIELD. */
export interface MovimientoDeRendimiento extends MovimientoParaRendimiento {
    readonly productId: string;
    readonly productName: string;
    readonly categoryId: string | null;
    readonly categoryName: string | null;
    readonly unitCost: number;
}

/** Lo que vendió el recorte que recupera la merma de una categoría. */
export interface RecuperacionDeMerma {
    readonly categoryId: string;
    readonly importe: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** YIELD: por producto o categoría, lo que entró, se vendió, se mermó, lo recuperado y la merma neta. */
export function armarRendimiento(
    movimientos: readonly MovimientoDeRendimiento[],
    recuperaciones: readonly RecuperacionDeMerma[],
    agrupar: 'PRODUCT' | 'CATEGORY',
    minimo = RENDIMIENTO_MINIMO_POR_OMISION
): { rows: YieldRow[]; totals: YieldTotals } {
    const grupos = new Map<string, { label: string; movs: MovimientoDeRendimiento[]; entradas: number; costo: number }>();
    for (const m of movimientos) {
        const key = agrupar === 'CATEGORY' ? (m.categoryId ?? '') : m.productId;
        const label = agrupar === 'CATEGORY' ? (m.categoryName ?? 'Sin categoría') : m.productName;
        const g = grupos.get(key) ?? { label, movs: [], entradas: 0, costo: 0 };
        g.movs.push(m);
        if (m.sourceType === 'PURCHASE') g.entradas += m.direction === 'IN' ? m.quantity : -m.quantity;
        if (m.sourceType === 'MERMA' && m.direction === 'OUT') g.costo += m.quantity * m.unitCost;
        grupos.set(key, g);
    }
    const recuperadoDe = new Map<string, number>();
    for (const r of recuperaciones) recuperadoDe.set(r.categoryId, (recuperadoDe.get(r.categoryId) ?? 0) + r.importe);
    if (agrupar === 'CATEGORY') {
        for (const [cat] of recuperadoDe) if (!grupos.has(cat)) grupos.set(cat, { label: 'Categoría', movs: [], entradas: 0, costo: 0 });
    }
    const rows: YieldRow[] = [...grupos.entries()].map(([key, g]) => {
        const r = rendimientoAprendido(g.movs);
        const recuperado = agrupar === 'CATEGORY' ? r2(recuperadoDe.get(key) ?? 0) : 0;
        const costoMerma = r2(g.costo);
        return {
            groupKey: key,
            groupLabel: g.label,
            entradas: Math.round(g.entradas * 10000) / 10000,
            vendido: r.vendido,
            merma: r.merma,
            rendimiento: r.rendimiento,
            costoMerma,
            recuperado,
            mermaNeta: r2(costoMerma - recuperado),
            bajo: r.rendimiento != null && r.rendimiento < minimo,
        };
    });
    rows.sort((a, b) => b.mermaNeta - a.mermaNeta || a.groupLabel.localeCompare(b.groupLabel, 'es'));
    const costoMerma = r2(rows.reduce((s, x) => s + x.costoMerma, 0));
    const recuperado = r2(recuperaciones.reduce((s, x) => s + x.importe, 0));
    return { rows, totals: { costoMerma, recuperado, mermaNeta: r2(costoMerma - recuperado) } };
}

/** LOW_YIELD: el producto rinde por debajo del mínimo (lo que se merma se lleva el margen). */
export function alertaDeRendimiento(
    p: { readonly productId: string; readonly productName: string; readonly productCode: string | null; readonly rendimiento: number | null; readonly costoMerma: number; readonly changedAt: string },
    minimo = RENDIMIENTO_MINIMO_POR_OMISION
): AlertaDerivada | null {
    if (p.rendimiento == null || p.rendimiento >= minimo) return null;
    return {
        id: idDeAlerta('LOW_YIELD', p.productId),
        kind: 'LOW_YIELD',
        severity: p.rendimiento < minimo - 0.1 ? 'HIGH' : 'MEDIUM',
        message: `${p.productName}: rinde ${Math.round(p.rendimiento * 1000) / 10} % (mínimo ${Math.round(minimo * 100)} %)`,
        productId: p.productId,
        productName: p.productName,
        productCode: p.productCode,
        warehouseId: null,
        warehouseName: null,
        docId: null,
        docNumber: null,
        onHand: null,
        threshold: minimo,
        daysWithoutMovement: null,
        valueAtRisk: r2(p.costoMerma),
        changedAt: p.changedAt,
    };
}
