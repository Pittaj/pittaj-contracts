/**
 * @fileoverview Las reglas de los reportes de Inventario (I5a), puras: la nube y el escritorio les
 * dan sus datos y sacan los mismos números.
 * @module Contracts/Inventory/Schemas/ReportesDeInventario
 *
 * **Espejo exacto en C#**: `Pittaj.Domain/Inventory/ReportesDeInventario.cs`. Los casos de
 * `reportesDeInventario.test.ts` y de `ReportesDeInventarioTests` son los mismos números: si una
 * punta cambia la regla, la prueba de la otra lo delata.
 *
 * ── La regla del costo ──
 *
 * Promedio **móvil** por producto × bodega, recorriendo el kárdex en orden (fecha, id). Es la de la
 * proyección (`reproyectar_existencia`, 0109; `ProyeccionDeExistencia` en el escritorio):
 *
 * - Entrada: costo negativo cuenta como 0; si no había existencia (≤ 0), el promedio es el costo de
 *   la entrada; si había, se pondera.
 * - Salida: baja la existencia y **no** cambia el promedio. La salida sale **al promedio**, no al
 *   costo escrito en el movimiento: las ventas se escriben con costo 0 y valuarlas así inventaría
 *   ganancia.
 *
 * Un kárdex de varias bodegas no es un promedio de promedios: es la **suma de las bodegas**, cada
 * una con su propio promedio. Por eso el saldo consolidado se arma bodega por bodega.
 *
 * ── Redondeo ──
 *
 * Los cálculos van sin redondear; lo que sale se redondea una vez: cantidades y costo unitario a 4
 * decimales, dinero y porcentajes a 2. Con el `Math.round` de JS (mitad hacia +∞), que en C# es
 * `Math.Floor(x * f + 0.5) / f` (no `MidpointRounding.ToPositiveInfinity`, que es techo).
 */

import type { StockSourceType } from '../responses/StockMovementResponse.js';
import type { KardexRow, MovementSummaryRow, StockValuationRow } from '../responses/InventoryReportsResponse.js';

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10_000) / 10_000;

// ── El paso de la proyección ─────────────────────────────────────────────────────────────────

export interface EstadoDeExistencia {
    readonly onHand: number;
    readonly averageCost: number;
}

export const EXISTENCIA_VACIA: EstadoDeExistencia = { onHand: 0, averageCost: 0 };

/** Un movimiento sobre la existencia de un par producto × bodega. */
export function pasoDeExistencia(
    e: EstadoDeExistencia,
    direction: 'IN' | 'OUT',
    quantity: number,
    unitCost: number
): EstadoDeExistencia {
    if (direction === 'OUT') return { onHand: e.onHand - quantity, averageCost: e.averageCost };
    const costo = unitCost < 0 ? 0 : unitCost;
    const averageCost = e.onHand <= 0 ? costo : (e.onHand * e.averageCost + quantity * costo) / (e.onHand + quantity);
    return { onHand: e.onHand + quantity, averageCost };
}

// ── Kárdex con saldo ─────────────────────────────────────────────────────────────────────────

export interface MovimientoDeKardex {
    readonly id: string;
    /** Instante ISO (UTC). */
    readonly occurredAt: string;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly direction: 'IN' | 'OUT';
    readonly quantity: number;
    readonly unitCost: number;
    readonly sourceType: StockSourceType;
    readonly sourceDocId: string | null;
    readonly userName?: string | null;
}

export interface TotalesDelKardex {
    readonly openingQuantity: number;
    readonly openingValue: number;
    readonly quantityIn: number;
    readonly quantityOut: number;
    readonly valueIn: number;
    readonly valueOut: number;
    readonly closingQuantity: number;
    readonly closingValue: number;
}

/** El orden canónico del kárdex: fecha y, a igual fecha, id (ordinal). */
export function ordenDelKardex(a: { occurredAt: string; id: string }, b: { occurredAt: string; id: string }): number {
    const t = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
    if (t !== 0) return t;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * El kárdex de un producto en `[desde, hasta)`: el saldo con el que abre (todo lo anterior a
 * `desde`), un renglón por movimiento del rango con el saldo después de él, y los totales.
 * `movimientos` trae **todo** lo anterior a `hasta` (sin ello no hay saldo inicial); lo posterior
 * se ignora. Varias bodegas = la suma de cada una (ver arriba).
 */
export function armarKardex(
    movimientos: readonly MovimientoDeKardex[],
    desde: Date,
    hasta: Date
): { rows: KardexRow[]; totals: TotalesDelKardex } {
    const porBodega = new Map<string, EstadoDeExistencia>();
    const consolidado = () => {
        let q = 0;
        let v = 0;
        for (const e of porBodega.values()) {
            q += e.onHand;
            v += e.onHand * e.averageCost;
        }
        return { q, v };
    };

    const ordenados = [...movimientos].sort(ordenDelKardex);
    const ini = desde.getTime();
    const fin = hasta.getTime();

    let apertura: { q: number; v: number } | null = null;
    const rows: KardexRow[] = [];
    let qIn = 0;
    let qOut = 0;
    let vIn = 0;
    let vOut = 0;

    for (const m of ordenados) {
        const t = new Date(m.occurredAt).getTime();
        if (t >= fin) break;
        if (t >= ini && apertura === null) apertura = consolidado();

        const antes = porBodega.get(m.warehouseId) ?? EXISTENCIA_VACIA;
        const despues = pasoDeExistencia(antes, m.direction, m.quantity, m.unitCost);
        porBodega.set(m.warehouseId, despues);
        if (t < ini) continue;

        // La salida sale al promedio que había; la entrada, a su costo.
        const costo = m.direction === 'IN' ? (m.unitCost < 0 ? 0 : m.unitCost) : antes.averageCost;
        if (m.direction === 'IN') {
            qIn += m.quantity;
            vIn += m.quantity * costo;
        } else {
            qOut += m.quantity;
            vOut += m.quantity * costo;
        }
        const saldo = consolidado();
        rows.push({
            movementId: m.id,
            occurredAt: m.occurredAt,
            sourceType: m.sourceType,
            sourceDocId: m.sourceDocId,
            warehouseName: m.warehouseName,
            lotNumber: null,
            quantityIn: m.direction === 'IN' ? r4(m.quantity) : 0,
            quantityOut: m.direction === 'OUT' ? r4(m.quantity) : 0,
            unitCost: r4(costo),
            balanceQuantity: r4(saldo.q),
            balanceAverageCost: r4(saldo.q !== 0 ? saldo.v / saldo.q : 0),
            balanceValue: r2(saldo.v),
            userName: m.userName ?? null,
        });
    }

    const abre = apertura ?? consolidado();
    const cierra = consolidado();
    return {
        rows,
        totals: {
            openingQuantity: r4(abre.q),
            openingValue: r2(abre.v),
            quantityIn: r4(qIn),
            quantityOut: r4(qOut),
            valueIn: r2(vIn),
            valueOut: r2(vOut),
            closingQuantity: r4(cierra.q),
            closingValue: r2(cierra.v),
        },
    };
}

// ── Existencias y valuación a una fecha ──────────────────────────────────────────────────────

/** Un par producto × bodega a la fecha, con lo que hace falta para agruparlo. */
export interface FilaDeExistencia {
    readonly productId: string;
    readonly productCode: string | null;
    readonly productName: string;
    readonly unit: string | null;
    readonly categoryId: string | null;
    readonly categoryName: string | null;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly supplierId?: string | null;
    readonly supplierName?: string | null;
    readonly onHand: number;
    readonly averageCost: number;
}

export type AgrupacionDeReporte = 'PRODUCT' | 'CATEGORY' | 'WAREHOUSE' | 'SUPPLIER';

const SIN = { CATEGORY: 'Sin categoría', SUPPLIER: 'Sin proveedor' } as const;

function llaveDe(f: FilaDeExistencia | ParDelPeriodo, por: AgrupacionDeReporte): { key: string; label: string } {
    switch (por) {
        case 'CATEGORY':
            return { key: f.categoryId ?? '', label: f.categoryName ?? SIN.CATEGORY };
        case 'WAREHOUSE':
            return { key: f.warehouseId, label: f.warehouseName };
        case 'SUPPLIER':
            return { key: f.supplierId ?? '', label: f.supplierName ?? SIN.SUPPLIER };
        default:
            return { key: f.productId, label: f.productName };
    }
}

/** Orden alfabético estable (español), y a igual nombre por llave. */
const porNombre = (a: { groupLabel: string; groupKey: string }, b: { groupLabel: string; groupKey: string }) =>
    a.groupLabel.localeCompare(b.groupLabel, 'es') || (a.groupKey < b.groupKey ? -1 : a.groupKey > b.groupKey ? 1 : 0);

/**
 * STOCK_AT_DATE (`agrupar` nulo: un renglón por producto × bodega, por nombre) y VALUATION
 * (agrupado: un renglón por grupo, de mayor a menor valor). `share` es el % del valor total.
 * Sin `includeZero`, los pares con existencia cero (a 4 decimales) no salen.
 */
export function armarValuacion(
    filas: readonly FilaDeExistencia[],
    agrupar: AgrupacionDeReporte | null,
    includeZero: boolean
): { rows: StockValuationRow[]; totals: { onHand: number; value: number } } {
    const vivas = includeZero ? filas : filas.filter((f) => r4(f.onHand) !== 0);
    const total = vivas.reduce((s, f) => s + f.onHand * f.averageCost, 0);
    const share = (v: number) => (total !== 0 ? r2((v / total) * 100) : 0);

    let rows: StockValuationRow[];
    if (agrupar === null) {
        rows = vivas
            .map((f) => {
                const value = f.onHand * f.averageCost;
                return {
                    groupKey: `${f.productId}:${f.warehouseId}`,
                    groupLabel: f.productName,
                    productId: f.productId,
                    productCode: f.productCode,
                    productName: f.productName,
                    warehouseName: f.warehouseName,
                    unit: f.unit,
                    onHand: r4(f.onHand),
                    averageCost: r4(f.averageCost),
                    value: r2(value),
                    share: share(value),
                    _bodega: f.warehouseName,
                };
            })
            .sort((a, b) => porNombre(a, b) || a._bodega.localeCompare(b._bodega, 'es'))
            .map(({ _bodega, ...r }) => r);
    } else {
        const grupos = new Map<string, { label: string; q: number; v: number; uno: FilaDeExistencia }>();
        for (const f of vivas) {
            const { key, label } = llaveDe(f, agrupar);
            const g = grupos.get(key) ?? { label, q: 0, v: 0, uno: f };
            g.q += f.onHand;
            g.v += f.onHand * f.averageCost;
            grupos.set(key, g);
        }
        rows = [...grupos.entries()]
            .map(([key, g]) => {
                const esProducto = agrupar === 'PRODUCT';
                return {
                    groupKey: key,
                    groupLabel: g.label,
                    productId: esProducto ? g.uno.productId : null,
                    productCode: esProducto ? g.uno.productCode : null,
                    productName: esProducto ? g.uno.productName : null,
                    warehouseName: agrupar === 'WAREHOUSE' ? g.label : null,
                    unit: esProducto ? g.uno.unit : null,
                    onHand: r4(g.q),
                    averageCost: r4(g.q !== 0 ? g.v / g.q : 0),
                    value: r2(g.v),
                    share: share(g.v),
                };
            })
            .sort((a, b) => b.value - a.value || porNombre(a, b));
    }
    return {
        rows,
        totals: { onHand: r4(vivas.reduce((s, f) => s + f.onHand, 0)), value: r2(total) },
    };
}

// ── Resumen de movimientos ───────────────────────────────────────────────────────────────────

/** Un par producto × bodega en el periodo: con qué abrió, qué entró y salió por tipo, con qué cerró. */
export interface ParDelPeriodo {
    readonly productId: string;
    readonly productName: string;
    readonly categoryId: string | null;
    readonly categoryName: string | null;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly supplierId?: string | null;
    readonly supplierName?: string | null;
    readonly opening: EstadoDeExistencia;
    readonly closing: EstadoDeExistencia;
    readonly inBySource: Readonly<Partial<Record<StockSourceType, number>>>;
    readonly outBySource: Readonly<Partial<Record<StockSourceType, number>>>;
}

/**
 * Los pares del periodo `[desde, hasta)` a partir del kárdex (lo que el escritorio tiene a mano; la
 * nube lo saca con SQL y la misma regla). `movimientos` trae todo lo anterior a `hasta`.
 */
export function paresDelPeriodo(
    movimientos: ReadonlyArray<MovimientoDeKardex & { productId: string }>,
    desde: Date,
    hasta: Date
): Array<Pick<ParDelPeriodo, 'productId' | 'warehouseId' | 'opening' | 'closing' | 'inBySource' | 'outBySource'>> {
    const ini = desde.getTime();
    const fin = hasta.getTime();
    const pares = new Map<
        string,
        { productId: string; warehouseId: string; e: EstadoDeExistencia; opening: EstadoDeExistencia | null; inS: Record<string, number>; outS: Record<string, number>; enRango: boolean }
    >();
    for (const m of [...movimientos].sort(ordenDelKardex)) {
        const t = new Date(m.occurredAt).getTime();
        if (t >= fin) continue;
        const k = `${m.productId}:${m.warehouseId}`;
        const p = pares.get(k) ?? { productId: m.productId, warehouseId: m.warehouseId, e: EXISTENCIA_VACIA, opening: null, inS: {}, outS: {}, enRango: false };
        if (t >= ini && p.opening === null) p.opening = p.e;
        p.e = pasoDeExistencia(p.e, m.direction, m.quantity, m.unitCost);
        if (t >= ini) {
            p.enRango = true;
            const bolsa = m.direction === 'IN' ? p.inS : p.outS;
            bolsa[m.sourceType] = (bolsa[m.sourceType] ?? 0) + m.quantity;
        }
        pares.set(k, p);
    }
    return [...pares.values()].map((p) => ({
        productId: p.productId,
        warehouseId: p.warehouseId,
        opening: p.opening ?? p.e,
        closing: p.e,
        inBySource: p.inS,
        outBySource: p.outS,
    }));
}

const sumarBolsa = (a: Partial<Record<StockSourceType, number>>, b: Readonly<Partial<Record<StockSourceType, number>>>) => {
    for (const [k, v] of Object.entries(b) as [StockSourceType, number][]) a[k] = (a[k] ?? 0) + v;
};
const redondearBolsa = (b: Partial<Record<StockSourceType, number>>) =>
    Object.fromEntries(Object.entries(b).map(([k, v]) => [k, r4(v as number)])) as Partial<Record<StockSourceType, number>>;

/**
 * MOVEMENT_SUMMARY: inicial + entradas − salidas = final, por grupo. Un par sin existencia al abrir
 * ni al cerrar y sin movimiento en el periodo no sale. Orden: por nombre del grupo.
 */
export function armarResumenDeMovimientos(
    pares: readonly ParDelPeriodo[],
    agrupar: AgrupacionDeReporte
): {
    rows: MovementSummaryRow[];
    totals: { openingQuantity: number; openingValue: number; closingQuantity: number; closingValue: number };
} {
    const grupos = new Map<
        string,
        { label: string; oq: number; ov: number; cq: number; cv: number; inS: Partial<Record<StockSourceType, number>>; outS: Partial<Record<StockSourceType, number>> }
    >();
    for (const p of pares) {
        const hubo = Object.keys(p.inBySource).length > 0 || Object.keys(p.outBySource).length > 0;
        if (!hubo && r4(p.opening.onHand) === 0 && r4(p.closing.onHand) === 0) continue;
        const { key, label } = llaveDe(p, agrupar);
        const g = grupos.get(key) ?? { label, oq: 0, ov: 0, cq: 0, cv: 0, inS: {}, outS: {} };
        g.oq += p.opening.onHand;
        g.ov += p.opening.onHand * p.opening.averageCost;
        g.cq += p.closing.onHand;
        g.cv += p.closing.onHand * p.closing.averageCost;
        sumarBolsa(g.inS, p.inBySource);
        sumarBolsa(g.outS, p.outBySource);
        grupos.set(key, g);
    }
    const rows = [...grupos.entries()]
        .map(([key, g]) => ({
            groupKey: key,
            groupLabel: g.label,
            openingQuantity: r4(g.oq),
            openingValue: r2(g.ov),
            inBySource: redondearBolsa(g.inS),
            outBySource: redondearBolsa(g.outS),
            closingQuantity: r4(g.cq),
            closingValue: r2(g.cv),
        }))
        .sort(porNombre);
    const suma = (k: 'oq' | 'ov' | 'cq' | 'cv') => [...grupos.values()].reduce((s, g) => s + g[k], 0);
    return {
        rows,
        totals: { openingQuantity: r4(suma('oq')), openingValue: r2(suma('ov')), closingQuantity: r4(suma('cq')), closingValue: r2(suma('cv')) },
    };
}
