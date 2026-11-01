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
import type {
    CountAccuracyRow,
    KardexRow,
    MovementSummaryRow,
    NoMovementRow,
    RotationAbcRow,
    ShrinkageRow,
    StockValuationRow,
} from '../responses/InventoryReportsResponse.js';
import type { AbcClass } from './countPlan.schema.js';
import { STOCK_ADJUSTMENT_REASON_LABELS, type StockAdjustmentReason } from './stockAdjustment.schema.js';

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

// ══ I5b ══════════════════════════════════════════════════════════════════════════════════════

// ── Costo de venta ───────────────────────────────────────────────────────────────────────────

/** Un movimiento del periodo de un par, lo mínimo para costearlo. */
export interface PasoDelPeriodo {
    readonly id: string;
    readonly occurredAt: string;
    readonly direction: 'IN' | 'OUT';
    readonly quantity: number;
    readonly unitCost: number;
    readonly sourceType: StockSourceType;
}

/**
 * El costo de lo vendido de UN par en el periodo, partiendo de su existencia al abrir (no hace falta
 * recorrer la historia: la nube la saca con `existencia_a_fecha`). Una venta sale al promedio que
 * había; una devolución de venta lo regresa al costo con que entra al kárdex. También deja el estado
 * al cierre, para el inventario promedio.
 */
export function consumoDelPar(
    apertura: EstadoDeExistencia,
    pasos: readonly PasoDelPeriodo[]
): { cogs: number; cierre: EstadoDeExistencia } {
    let e = apertura;
    let cogs = 0;
    for (const m of [...pasos].sort(ordenDelKardex)) {
        if (m.sourceType === 'SALE' && m.direction === 'OUT') cogs += m.quantity * e.averageCost;
        if (m.sourceType === 'RETURN' && m.direction === 'IN') cogs -= m.quantity * (m.unitCost < 0 ? 0 : m.unitCost);
        e = pasoDeExistencia(e, m.direction, m.quantity, m.unitCost);
    }
    return { cogs, cierre: e };
}

// ── Rotación y ABC ───────────────────────────────────────────────────────────────────────────

export interface ConsumoDeProducto {
    readonly productId: string;
    readonly productCode: string | null;
    readonly productName: string;
    readonly cogs: number;
    /** Valor al abrir y al cerrar el periodo (Σ de sus bodegas). */
    readonly valorInicial: number;
    readonly valorFinal: number;
}

/**
 * ROTATION_ABC. Inventario promedio = (inicial + final) / 2; rotación = costo de venta / inventario
 * promedio; días de inventario = inventario promedio / costo de venta × días del periodo. Sin
 * inventario o sin venta, nulos (no es cero: es «no se puede decir»).
 *
 * La clase la decide el **% acumulado del costo de venta** antes del producto, de mayor a menor:
 * mientras no se llega a `cutoffA` es A, a `cutoffB` es B, después C. Así el primero es A aunque él
 * solo pase del 80 %. Lo que no se vendió es C.
 */
export function armarRotacionAbc(
    productos: readonly ConsumoDeProducto[],
    dias: number,
    cortes: { cutoffA: number; cutoffB: number },
    soloClase?: AbcClass
): { rows: RotationAbcRow[]; totals: { cogs: number; averageInventoryValue: number; turnover: number | null; daysOfInventory: number | null } } {
    const total = productos.reduce((s, p) => s + Math.max(p.cogs, 0), 0);
    const ordenados = [...productos].sort(
        (a, b) => b.cogs - a.cogs || a.productName.localeCompare(b.productName, 'es') || (a.productId < b.productId ? -1 : 1)
    );
    let acumulado = 0;
    const indicadores = (cogs: number, prom: number) => ({
        turnover: prom > 0 && cogs > 0 ? r2(cogs / prom) : null,
        daysOfInventory: cogs > 0 ? Math.round((prom / cogs) * dias * 10) / 10 : null,
    });
    const rows: RotationAbcRow[] = ordenados.map((p) => {
        const antes = total > 0 ? (acumulado / total) * 100 : 100;
        acumulado += Math.max(p.cogs, 0);
        const abcClass: AbcClass = p.cogs <= 0 ? 'C' : antes < cortes.cutoffA ? 'A' : antes < cortes.cutoffB ? 'B' : 'C';
        const prom = (p.valorInicial + p.valorFinal) / 2;
        return {
            productId: p.productId,
            productCode: p.productCode,
            productName: p.productName,
            abcClass,
            cogs: r2(p.cogs),
            averageInventoryValue: r2(prom),
            ...indicadores(p.cogs, prom),
            cumulativeShare: total > 0 ? r2((acumulado / total) * 100) : 0,
        };
    });
    const prom = productos.reduce((s, p) => s + (p.valorInicial + p.valorFinal) / 2, 0);
    const cogs = productos.reduce((s, p) => s + p.cogs, 0);
    return {
        rows: soloClase ? rows.filter((r) => r.abcClass === soloClase) : rows,
        totals: { cogs: r2(cogs), averageInventoryValue: r2(prom), ...indicadores(cogs, prom) },
    };
}

// ── Sin movimiento ───────────────────────────────────────────────────────────────────────────

export interface ParQuieto {
    readonly productId: string;
    readonly productCode: string | null;
    readonly productName: string;
    readonly warehouseName: string;
    readonly onHand: number;
    readonly averageCost: number;
    readonly firstMovementAt: string | null;
    readonly lastMovementAt: string | null;
    readonly lastSaleAt: string | null;
}

const DIA_MS = 86_400_000;

/**
 * NO_MOVEMENT: los pares con existencia que llevan `dias` o más sin moverse — sin **venderse** si
 * `soloVentas` (una devolución o un traspaso no son rotación). Lo que nunca se vendió cuenta desde
 * su primer movimiento. De más a menos dinero parado.
 */
export function armarSinMovimiento(
    pares: readonly ParQuieto[],
    ahora: Date,
    dias: number,
    soloVentas: boolean
): { rows: NoMovementRow[]; totals: { value: number; products: number } } {
    const rows: NoMovementRow[] = [];
    for (const p of pares) {
        if (r4(p.onHand) <= 0) continue;
        const desde = (soloVentas ? p.lastSaleAt : p.lastMovementAt) ?? p.firstMovementAt;
        if (!desde) continue;
        const daysIdle = Math.floor((ahora.getTime() - new Date(desde).getTime()) / DIA_MS);
        if (daysIdle < dias) continue;
        rows.push({
            productId: p.productId,
            productCode: p.productCode,
            productName: p.productName,
            warehouseName: p.warehouseName,
            onHand: r4(p.onHand),
            value: r2(p.onHand * p.averageCost),
            lastMovementAt: p.lastMovementAt,
            lastSaleAt: p.lastSaleAt,
            daysIdle,
        });
    }
    rows.sort((a, b) => b.value - a.value || b.daysIdle - a.daysIdle || a.productName.localeCompare(b.productName, 'es'));
    return {
        rows,
        totals: { value: r2(rows.reduce((s, r) => s + r.value, 0)), products: new Set(rows.map((r) => r.productId)).size },
    };
}

// ── Merma y ajustes ──────────────────────────────────────────────────────────────────────────

/** Un movimiento de ajuste, merma o conteo del periodo. */
export interface MovimientoDeMerma {
    readonly productId: string;
    readonly productName: string;
    readonly categoryId: string | null;
    readonly categoryName: string | null;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly sourceType: StockSourceType;
    readonly reason: StockAdjustmentReason | null;
    readonly direction: 'IN' | 'OUT';
    readonly quantity: number;
    readonly unitCost: number;
    readonly sourceDocId: string | null;
}

/** El motivo cuando el movimiento no lo trae (espejo de `motivoPorTipo` de Contabilidad). */
export function motivoDeMerma(m: Pick<MovimientoDeMerma, 'sourceType' | 'reason'>): StockAdjustmentReason {
    if (m.reason) return m.reason;
    if (m.sourceType === 'MERMA') return 'SHRINKAGE';
    if (m.sourceType === 'COUNT') return 'COUNT';
    if (m.sourceType === 'INITIAL') return 'OPENING';
    return 'OTHER';
}

/**
 * SHRINKAGE: lo que el inventario perdió (o ganó) por ajustes, mermas y conteos, **al costo con que
 * se asentó** (el mismo que la póliza). Una salida suma; una entrada (un sobrante) resta. El
 * inventario inicial no es merma y no entra. `cogs` da el % sobre el costo de venta del periodo.
 */
export function armarMerma(
    movimientos: readonly MovimientoDeMerma[],
    agrupar: 'REASON' | 'PRODUCT' | 'CATEGORY' | 'WAREHOUSE',
    cogs: number | null
): { rows: ShrinkageRow[]; totals: { value: number; pctOfCogs: number | null } } {
    const pctDe = (v: number) => (cogs && cogs > 0 ? r2((v / cogs) * 100) : null);
    const grupos = new Map<string, { label: string; reason: StockAdjustmentReason | null; q: number; v: number; docs: Set<string> }>();
    let total = 0;
    for (const m of movimientos) {
        const motivo = motivoDeMerma(m);
        if (m.sourceType === 'INITIAL' || motivo === 'OPENING') continue;
        const signo = m.direction === 'OUT' ? 1 : -1;
        const valor = signo * m.quantity * m.unitCost;
        total += valor;
        const { key, label } =
            agrupar === 'REASON'
                ? { key: motivo, label: STOCK_ADJUSTMENT_REASON_LABELS[motivo] }
                : agrupar === 'CATEGORY'
                  ? { key: m.categoryId ?? '', label: m.categoryName ?? SIN.CATEGORY }
                  : agrupar === 'WAREHOUSE'
                    ? { key: m.warehouseId, label: m.warehouseName }
                    : { key: m.productId, label: m.productName };
        const g = grupos.get(key) ?? { label, reason: agrupar === 'REASON' ? motivo : null, q: 0, v: 0, docs: new Set<string>() };
        g.q += signo * m.quantity;
        g.v += valor;
        if (m.sourceDocId) g.docs.add(m.sourceDocId);
        grupos.set(key, g);
    }
    const rows = [...grupos.entries()]
        .map(([key, g]) => ({
            groupKey: key,
            groupLabel: g.label,
            reason: g.reason,
            quantity: r4(g.q),
            value: r2(g.v),
            pctOfCogs: pctDe(g.v),
            documents: g.docs.size,
        }))
        .sort((a, b) => b.value - a.value || porNombre(a, b));
    return { rows, totals: { value: r2(total), pctOfCogs: pctDe(total) } };
}

// ── Exactitud de conteos ─────────────────────────────────────────────────────────────────────

export interface ConteoAplicado {
    readonly countId: string;
    readonly countNumber: string;
    readonly appliedAt: string;
    readonly warehouseName: string;
    readonly lines: ReadonlyArray<{ readonly expected: number | null; readonly counted: number | null; readonly unitCost: number }>;
}

/**
 * COUNT_ACCURACY: por conteo aplicado, cuántos renglones contados cuadraron (contado = teórico, a 4
 * decimales) y cuánto valió la diferencia, con signo y en absoluto. La exactitud lleva un decimal,
 * como en el tablero (`exactitudDeConteos`). Del más reciente al más viejo.
 */
export function armarExactitud(conteos: readonly ConteoAplicado[]): {
    rows: CountAccuracyRow[];
    totals: { linesCounted: number; linesMatched: number; accuracy: number | null; differenceValue: number; absoluteDifferenceValue: number };
} {
    let lc = 0;
    let lm = 0;
    let dv = 0;
    let av = 0;
    const rows = conteos
        .map((c) => {
            let contados = 0;
            let cuadrados = 0;
            let dif = 0;
            let abs = 0;
            for (const l of c.lines) {
                if (l.counted == null) continue;
                contados += 1;
                const d = l.counted - (l.expected ?? 0);
                if (r4(d) === 0) cuadrados += 1;
                dif += d * l.unitCost;
                abs += Math.abs(d) * l.unitCost;
            }
            lc += contados;
            lm += cuadrados;
            dv += dif;
            av += abs;
            return {
                countId: c.countId,
                countNumber: c.countNumber,
                appliedAt: c.appliedAt,
                warehouseName: c.warehouseName,
                linesCounted: contados,
                linesMatched: cuadrados,
                accuracy: contados > 0 ? Math.round((cuadrados / contados) * 1000) / 10 : 0,
                differenceValue: r2(dif),
                absoluteDifferenceValue: r2(abs),
            };
        })
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime() || (a.countNumber < b.countNumber ? 1 : -1));
    return {
        rows,
        totals: {
            linesCounted: lc,
            linesMatched: lm,
            accuracy: lc > 0 ? Math.round((lm / lc) * 1000) / 10 : null,
            differenceValue: r2(dv),
            absoluteDifferenceValue: r2(av),
        },
    };
}
