/**
 * @fileoverview (2.88.0) Producción del día y los tres reportes de Producción: Costos, Rendimiento y
 * Merma de producción. Una sola cuenta para las dos plataformas.
 * @module Contracts/Production/ReportesDeProduccion
 *
 * Espejo literal de `Pittaj.Domain.Production.ReportesDeProduccion` del escritorio, que calcula con
 * lo local (sin red); la nube calcula con lo suyo usando estas funciones. Maqueta normativa:
 * `docs/public/mockups/produccion.html`.
 *
 * ── Las cuentas ──
 *
 * - **Consumo estándar** de un insumo = su planeado × obtenido ÷ planeado de la orden: lo que la
 *   receta pedía para lo que realmente salió.
 * - **Costo estándar** = Σ consumo estándar × el costo unitario con el que salió ese insumo. Usa el
 *   mismo costo que la orden real, así que la variación mide **cantidades**, no precios.
 * - **Rendimiento** = obtenido ÷ planeado.
 * - **Merma** = consumido − estándar, al costo unitario. Negativa es ahorro.
 * - **Sugerencia del día**: la regla del reabasto (`purchase/reposicion.ts`) con dos cambios —
 *   lo que está en proceso cuenta como lo que ya viene, y se redondea **hacia arriba** al lote de
 *   la receta (medio lote no existe; quedarse corto es no vender).
 *
 * Los reportes miran solo órdenes **terminadas**; el periodo lo filtra quien llama, por `completedAt`.
 */

import { z } from 'zod';
import type { ProductionOrderStatus } from '../responses/ProductionOrderResponse.js';

// ── Lo que se lee de una orden ──────────────────────────────────────────────────────────────────

export interface RenglonParaReporte {
    readonly componentProductId: string;
    readonly componentName: string;
    readonly plannedQuantity: number;
    readonly consumedQuantity: number;
    readonly unitCost: number;
}

export interface OrdenParaReporte {
    readonly id: string;
    readonly orderNumber: string;
    readonly productId: string;
    readonly productName: string;
    readonly warehouseId: string;
    readonly status: ProductionOrderStatus;
    readonly plannedQuantity: number;
    readonly producedQuantity: number;
    readonly totalCost: number;
    readonly unitCost: number;
    readonly completedAt: string | null;
    readonly version?: number;
    readonly lines: readonly RenglonParaReporte[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10_000) / 10_000;
const r1 = (n: number) => Math.round(n * 10) / 10;

function terminadas(ordenes: readonly OrdenParaReporte[]): OrdenParaReporte[] {
    return ordenes.filter((o) => o.status === 'COMPLETED' && o.producedQuantity > 0);
}

/** Lo que la receta pedía de este insumo para lo que realmente se obtuvo. */
export function consumoEstandar(orden: Pick<OrdenParaReporte, 'plannedQuantity' | 'producedQuantity'>, renglon: Pick<RenglonParaReporte, 'plannedQuantity'>): number {
    const factor = orden.plannedQuantity > 0 ? orden.producedQuantity / orden.plannedQuantity : 1;
    return renglon.plannedQuantity * factor;
}

/** Lo que debió costar la orden con su receta, a los costos con los que salieron los insumos. */
export function costoEstandar(orden: OrdenParaReporte): number {
    return orden.lines.reduce((s, l) => s + consumoEstandar(orden, l) * l.unitCost, 0);
}

// ── Costos de producción ────────────────────────────────────────────────────────────────────────

export interface ProductionCostRow {
    readonly productId: string;
    readonly productName: string;
    readonly orders: number;
    readonly producedQuantity: number;
    readonly totalCost: number;
    /** Costo total ÷ obtenido en el periodo. */
    readonly unitCost: number;
    readonly minUnitCost: number;
    readonly maxUnitCost: number;
    /** El de la orden terminada más reciente. */
    readonly lastUnitCost: number;
    readonly standardCost: number;
    /** Costo − estándar. Positiva = costó de más. */
    readonly variance: number;
}

export interface ProductionCostsReport {
    readonly rows: readonly ProductionCostRow[];
    readonly totals: { readonly orders: number; readonly totalCost: number; readonly standardCost: number; readonly variance: number };
}

export function costosDeProduccion(ordenes: readonly OrdenParaReporte[]): ProductionCostsReport {
    const grupos = new Map<string, OrdenParaReporte[]>();
    for (const o of terminadas(ordenes)) {
        const g = grupos.get(o.productId);
        if (g) g.push(o);
        else grupos.set(o.productId, [o]);
    }
    const rows: ProductionCostRow[] = [];
    for (const [productId, os] of grupos) {
        const producido = os.reduce((s, o) => s + o.producedQuantity, 0);
        const total = os.reduce((s, o) => s + o.totalCost, 0);
        const estandar = os.reduce((s, o) => s + costoEstandar(o), 0);
        const unitarios = os.map((o) => o.unitCost);
        const ultima = [...os].sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? '')).at(-1)!;
        rows.push({
            productId,
            productName: ultima.productName,
            orders: os.length,
            producedQuantity: r4(producido),
            totalCost: r2(total),
            unitCost: r4(producido > 0 ? total / producido : 0),
            minUnitCost: r4(Math.min(...unitarios)),
            maxUnitCost: r4(Math.max(...unitarios)),
            lastUnitCost: r4(ultima.unitCost),
            standardCost: r2(estandar),
            variance: r2(total - estandar),
        });
    }
    rows.sort((a, b) => b.totalCost - a.totalCost || a.productName.localeCompare(b.productName));
    const totalCost = r2(rows.reduce((s, r) => s + r.totalCost, 0));
    const standardCost = r2(rows.reduce((s, r) => s + r.standardCost, 0));
    return {
        rows,
        totals: { orders: rows.reduce((s, r) => s + r.orders, 0), totalCost, standardCost, variance: r2(totalCost - standardCost) },
    };
}

// ── Rendimiento ─────────────────────────────────────────────────────────────────────────────────

export interface ProductionYieldRow {
    readonly orderId: string;
    readonly orderNumber: string;
    readonly productId: string;
    readonly productName: string;
    readonly warehouseId: string;
    readonly completedAt: string | null;
    readonly plannedQuantity: number;
    readonly producedQuantity: number;
    /** Obtenido ÷ planeado, en %, a un decimal. */
    readonly yieldPercent: number;
    /** Debajo del rendimiento mínimo. Arriba del 100 % no se marca. */
    readonly belowTolerance: boolean;
}

export interface ProductionYieldByProduct {
    readonly productId: string;
    readonly productName: string;
    readonly orders: number;
    readonly plannedQuantity: number;
    readonly producedQuantity: number;
    readonly yieldPercent: number;
    readonly worstYieldPercent: number;
    readonly belowTolerance: number;
}

export interface ProductionYieldReport {
    readonly minYieldPercent: number;
    readonly rows: readonly ProductionYieldRow[];
    readonly byProduct: readonly ProductionYieldByProduct[];
    readonly totals: { readonly orders: number; readonly belowTolerance: number };
}

function rendimientoPct(planeado: number, obtenido: number): number {
    return planeado > 0 ? r1((obtenido / planeado) * 100) : 100;
}

export function rendimientoDeProduccion(ordenes: readonly OrdenParaReporte[], minYieldPercent: number): ProductionYieldReport {
    const rows: ProductionYieldRow[] = terminadas(ordenes).map((o) => {
        const y = rendimientoPct(o.plannedQuantity, o.producedQuantity);
        return {
            orderId: o.id,
            orderNumber: o.orderNumber,
            productId: o.productId,
            productName: o.productName,
            warehouseId: o.warehouseId,
            completedAt: o.completedAt,
            plannedQuantity: o.plannedQuantity,
            producedQuantity: o.producedQuantity,
            yieldPercent: y,
            belowTolerance: y < minYieldPercent,
        };
    });
    // Lo que hay que mirar, primero; luego por fecha.
    rows.sort((a, b) => Number(b.belowTolerance) - Number(a.belowTolerance) || (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));

    const grupos = new Map<string, ProductionYieldRow[]>();
    for (const r of rows) {
        const g = grupos.get(r.productId);
        if (g) g.push(r);
        else grupos.set(r.productId, [r]);
    }
    const byProduct: ProductionYieldByProduct[] = [...grupos].map(([productId, rs]) => {
        const planeado = rs.reduce((s, r) => s + r.plannedQuantity, 0);
        const obtenido = rs.reduce((s, r) => s + r.producedQuantity, 0);
        return {
            productId,
            productName: rs[0]!.productName,
            orders: rs.length,
            plannedQuantity: r4(planeado),
            producedQuantity: r4(obtenido),
            yieldPercent: rendimientoPct(planeado, obtenido),
            worstYieldPercent: Math.min(...rs.map((r) => r.yieldPercent)),
            belowTolerance: rs.filter((r) => r.belowTolerance).length,
        };
    });
    byProduct.sort((a, b) => a.yieldPercent - b.yieldPercent || a.productName.localeCompare(b.productName));
    return {
        minYieldPercent,
        rows,
        byProduct,
        totals: { orders: rows.length, belowTolerance: rows.filter((r) => r.belowTolerance).length },
    };
}

// ── Merma de producción ─────────────────────────────────────────────────────────────────────────

export interface ProductionWasteRow {
    readonly componentProductId: string;
    readonly componentName: string;
    readonly orders: number;
    readonly standardQuantity: number;
    readonly consumedQuantity: number;
    /** Consumido − estándar. Negativa = ahorro. */
    readonly difference: number;
    /** Diferencia ÷ estándar, en %, a un decimal. */
    readonly differencePercent: number;
    /** La diferencia al costo con el que salió el insumo en cada orden. */
    readonly value: number;
    readonly overTolerance: boolean;
}

export interface ProductionWasteReport {
    readonly maxOverconsumptionPercent: number;
    readonly rows: readonly ProductionWasteRow[];
    readonly totals: { readonly value: number; readonly overTolerance: number };
}

export function mermaDeProduccion(ordenes: readonly OrdenParaReporte[], maxOverconsumptionPercent: number): ProductionWasteReport {
    const acc = new Map<string, { name: string; ordenes: Set<string>; estandar: number; consumido: number; valor: number }>();
    for (const o of terminadas(ordenes)) {
        for (const l of o.lines) {
            const e = consumoEstandar(o, l);
            const a = acc.get(l.componentProductId) ?? { name: l.componentName, ordenes: new Set<string>(), estandar: 0, consumido: 0, valor: 0 };
            a.ordenes.add(o.id);
            a.estandar += e;
            a.consumido += l.consumedQuantity;
            a.valor += (l.consumedQuantity - e) * l.unitCost;
            acc.set(l.componentProductId, a);
        }
    }
    const rows: ProductionWasteRow[] = [...acc].map(([componentProductId, a]) => {
        const diferencia = a.consumido - a.estandar;
        const pct = a.estandar > 0 ? r1((diferencia / a.estandar) * 100) : 0;
        return {
            componentProductId,
            componentName: a.name,
            orders: a.ordenes.size,
            standardQuantity: r4(a.estandar),
            consumedQuantity: r4(a.consumido),
            difference: r4(diferencia),
            differencePercent: pct,
            value: r2(a.valor),
            overTolerance: pct > maxOverconsumptionPercent,
        };
    });
    // Lo que más cuesta, arriba.
    rows.sort((a, b) => b.value - a.value || a.componentName.localeCompare(b.componentName));
    return {
        maxOverconsumptionPercent,
        rows,
        totals: { value: r2(rows.reduce((s, r) => s + r.value, 0)), overTolerance: rows.filter((r) => r.overTolerance).length },
    };
}

// ── Producción del día ──────────────────────────────────────────────────────────────────────────

/** Un producto con receta activa y nivel de existencia en la bodega. */
export interface ProductoParaProducir {
    readonly productId: string;
    readonly productName: string;
    /** Existencia en la bodega. */
    readonly existencia: number;
    /** Lo planeado en órdenes abiertas (borrador y liberadas) de este producto en la bodega. */
    readonly enProceso: number;
    readonly minimo: number;
    /** `0` = no definido; manda el mínimo. */
    readonly puntoDeReorden: number;
    /** `0` = sin máximo; se repone hasta el doble del umbral. */
    readonly maximo: number;
    /** Lo que rinde un lote de la receta. */
    readonly rinde: number;
    /** Costo de una unidad con la receta, al promedio de hoy. */
    readonly costoUnitarioEstimado: number;
}

function umbral(p: ProductoParaProducir): number {
    return p.puntoDeReorden > 0 ? p.puntoDeReorden : p.minimo;
}

/** Cuánto producir hoy. `0` = nada (sin umbral, o la existencia más lo que está en proceso alcanza). */
export function sugerenciaDeProduccion(p: ProductoParaProducir): number {
    const u = umbral(p);
    if (u <= 0) return 0;
    const posicion = p.existencia + Math.max(p.enProceso, 0);
    if (posicion > u) return 0;
    const objetivo = p.maximo > 0 ? p.maximo : u * 2;
    const falta = objetivo - posicion;
    if (falta <= 0) return 0;
    const lote = p.rinde > 0 ? p.rinde : 1;
    return r4(Math.ceil(r4(falta / lote)) * lote);
}

/** La cuenta, en palabras: lo que la pantalla enseña al pasar por encima de «Producir». */
export function explicarSugerencia(p: ProductoParaProducir): string {
    const u = umbral(p);
    const enProceso = Math.max(p.enProceso, 0);
    const posicion = p.existencia + enProceso;
    const cantidad = sugerenciaDeProduccion(p);
    const queUmbral = p.puntoDeReorden > 0 ? 'punto de reorden' : 'mínimo';
    const hay = enProceso > 0 ? `Hay ${p.existencia} y ${enProceso} en proceso: ${posicion}` : `Hay ${p.existencia}`;
    if (u <= 0) return 'Sin mínimo ni punto de reorden en esta bodega: no se sugiere.';
    if (cantidad <= 0) return `${hay}, que pasa del ${queUmbral} (${u}): no hace falta producir.`;
    const objetivo = p.maximo > 0 ? p.maximo : u * 2;
    const hasta = p.maximo > 0 ? 'hasta el máximo' : `hasta el doble del ${queUmbral}, porque no hay máximo`;
    const lote = p.rinde > 0 ? p.rinde : 1;
    const lotes = Math.round(cantidad / lote);
    const redondeo = lote === 1 ? '' : `, redondeado hacia arriba al lote de ${lote} → ${cantidad} (${lotes} lote${lotes === 1 ? '' : 's'})`;
    return `${hay}, que no pasa del ${queUmbral} (${u}). Se repone ${hasta}: ${objetivo} − ${posicion} = ${r4(objetivo - posicion)}${redondeo}.`;
}

export interface SugerenciaDelDia {
    readonly productId: string;
    readonly productName: string;
    readonly existencia: number;
    readonly enProceso: number;
    readonly minimo: number;
    readonly puntoDeReorden: number;
    readonly maximo: number;
    readonly rinde: number;
    readonly cantidad: number;
    readonly lotes: number;
    readonly costoEstimado: number;
    readonly explicacion: string;
}

export interface InsumoDelDia {
    readonly componentProductId: string;
    readonly componentName: string;
    /** Σ consumos planeados de las órdenes abiertas de la bodega. */
    readonly piden: number;
    readonly hay: number;
    readonly faltan: number;
}

/** Los insumos que piden las órdenes abiertas contra la existencia de la bodega. Los que faltan, arriba. */
export function insumosDeOrdenes(abiertas: readonly OrdenParaReporte[], existencia: (productId: string) => number): InsumoDelDia[] {
    const acc = new Map<string, { name: string; piden: number }>();
    for (const o of abiertas) {
        if (o.status !== 'DRAFT' && o.status !== 'RELEASED') continue;
        for (const l of o.lines) {
            const a = acc.get(l.componentProductId) ?? { name: l.componentName, piden: 0 };
            a.piden += l.plannedQuantity;
            acc.set(l.componentProductId, a);
        }
    }
    const filas = [...acc].map(([componentProductId, a]) => {
        const hay = existencia(componentProductId);
        return { componentProductId, componentName: a.name, piden: r4(a.piden), hay: r4(hay), faltan: r4(Math.max(a.piden - hay, 0)) };
    });
    filas.sort((a, b) => Number(b.faltan > 0) - Number(a.faltan > 0) || a.componentName.localeCompare(b.componentName));
    return filas;
}

export interface OrdenDelDia {
    readonly id: string;
    readonly orderNumber: string;
    readonly productId: string;
    readonly productName: string;
    readonly status: ProductionOrderStatus;
    readonly plannedQuantity: number;
    readonly producedQuantity: number;
    readonly unitCost: number;
    readonly totalCost: number;
    readonly completedAt: string | null;
    readonly version: number;
}

/** GET /api/production-orders/daily — el tablero. Todo derivado: no hay «plan del día» guardado. */
export interface ProduccionDelDiaResponse {
    readonly warehouseId: string | null;
    /** Si la configuración apaga la sugerencia, `sugerencias` va vacía y esto en falso. */
    readonly sugiere: boolean;
    readonly sugerencias: readonly SugerenciaDelDia[];
    readonly enProceso: readonly OrdenDelDia[];
    readonly insumos: readonly InsumoDelDia[];
    readonly terminadas: readonly OrdenDelDia[];
    readonly totales: {
        readonly porProducir: number;
        readonly costoPorProducir: number;
        readonly insumosQueFaltan: number;
        readonly terminadasHoy: number;
        readonly costoTerminadoHoy: number;
    };
}

function aOrdenDelDia(o: OrdenParaReporte): OrdenDelDia {
    return {
        id: o.id,
        orderNumber: o.orderNumber,
        productId: o.productId,
        productName: o.productName,
        status: o.status,
        plannedQuantity: o.plannedQuantity,
        producedQuantity: o.producedQuantity,
        unitCost: o.unitCost,
        totalCost: o.totalCost,
        completedAt: o.completedAt,
        version: o.version ?? 1,
    };
}

/**
 * Arma el tablero. `productos` trae los que tienen receta activa y nivel en la bodega, **sin**
 * `enProceso` calculado (aquí se suma de `abiertas`). `terminadasDesde` es el inicio del día del
 * equipo que pregunta (ISO), no el de la nube.
 */
export function produccionDelDia(input: {
    readonly warehouseId: string | null;
    readonly sugiere: boolean;
    readonly productos: readonly Omit<ProductoParaProducir, 'enProceso'>[];
    readonly ordenes: readonly OrdenParaReporte[];
    readonly existencia: (productId: string) => number;
    readonly terminadasDesde: string;
}): ProduccionDelDiaResponse {
    const deLaBodega = input.ordenes.filter((o) => !input.warehouseId || o.warehouseId === input.warehouseId);
    const abiertas = deLaBodega.filter((o) => o.status === 'DRAFT' || o.status === 'RELEASED');
    const desde = Date.parse(input.terminadasDesde);
    const terminadas = deLaBodega
        .filter((o) => o.status === 'COMPLETED' && o.completedAt && Date.parse(o.completedAt) >= desde)
        .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));

    const enProcesoDe = new Map<string, number>();
    for (const o of abiertas) enProcesoDe.set(o.productId, (enProcesoDe.get(o.productId) ?? 0) + o.plannedQuantity);

    const sugerencias: SugerenciaDelDia[] = [];
    if (input.sugiere) {
        for (const base of input.productos) {
            const p: ProductoParaProducir = { ...base, enProceso: r4(enProcesoDe.get(base.productId) ?? 0) };
            const cantidad = sugerenciaDeProduccion(p);
            if (cantidad <= 0) continue;
            const lote = p.rinde > 0 ? p.rinde : 1;
            sugerencias.push({
                productId: p.productId,
                productName: p.productName,
                existencia: p.existencia,
                enProceso: p.enProceso,
                minimo: p.minimo,
                puntoDeReorden: p.puntoDeReorden,
                maximo: p.maximo,
                rinde: p.rinde,
                cantidad,
                lotes: Math.round(cantidad / lote),
                costoEstimado: r2(cantidad * p.costoUnitarioEstimado),
                explicacion: explicarSugerencia(p),
            });
        }
        sugerencias.sort((a, b) => a.existencia + a.enProceso - (b.existencia + b.enProceso) || a.productName.localeCompare(b.productName));
    }

    const insumos = insumosDeOrdenes(abiertas, input.existencia);
    return {
        warehouseId: input.warehouseId,
        sugiere: input.sugiere,
        sugerencias,
        enProceso: abiertas.map(aOrdenDelDia).sort((a, b) => a.orderNumber.localeCompare(b.orderNumber)),
        insumos,
        terminadas: terminadas.map(aOrdenDelDia),
        totales: {
            porProducir: sugerencias.length,
            costoPorProducir: r2(sugerencias.reduce((s, x) => s + x.costoEstimado, 0)),
            insumosQueFaltan: insumos.filter((i) => i.faltan > 0).length,
            terminadasHoy: terminadas.length,
            costoTerminadoHoy: r2(terminadas.reduce((s, o) => s + o.totalCost, 0)),
        },
    };
}

/** El costo de una unidad con la receta: Σ cantidad × costo promedio ÷ lo que rinde. */
export function costoUnitarioDeReceta(rinde: number, renglones: ReadonlyArray<{ quantity: number; costo: number }>): number {
    if (rinde <= 0) return 0;
    return r4(renglones.reduce((s, r) => s + r.quantity * r.costo, 0) / rinde);
}

// ── Lo que se pide ──────────────────────────────────────────────────────────────────────────────

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha AAAA-MM-DD');

/**
 * GET /api/production-orders/reports/{costs,yield,waste}. El periodo es por fecha de terminado,
 * con los dos días incluidos; `tz` es el desfase del equipo en minutos (`getTimezoneOffset()`),
 * para que «el 13» sea el 13 de quien pregunta y no el de la nube.
 */
export const getProductionReportSchema = z.object({
    from: fecha,
    to: fecha,
    warehouseId: z.string().uuid().optional(),
    tz: z.coerce.number().int().min(-840).max(840).optional().default(0),
});
export type GetProductionReportQuery = z.infer<typeof getProductionReportSchema>;

/** El intervalo [desde, hasta) en UTC de un periodo local. */
export function intervaloDelPeriodo(q: Pick<GetProductionReportQuery, 'from' | 'to' | 'tz'>): { desde: Date; hasta: Date } {
    const desde = new Date(Date.parse(`${q.from}T00:00:00Z`) + (q.tz ?? 0) * 60_000);
    const hasta = new Date(Date.parse(`${q.to}T00:00:00Z`) + 86_400_000 + (q.tz ?? 0) * 60_000);
    return { desde, hasta };
}

/** GET /api/production-orders/daily. `since` = la medianoche del equipo (ISO); sin ella, la de UTC. */
export const getProduccionDelDiaSchema = z.object({
    warehouseId: z.string().uuid().optional(),
    since: z.string().datetime({ offset: true }).optional(),
});
export type GetProduccionDelDiaQuery = z.infer<typeof getProduccionDelDiaSchema>;

/** GET /api/production-orders/reports/* — el reporte con su periodo. */
export type ProductionCostsReportResponse = ProductionCostsReport & { readonly from: string; readonly to: string };
export type ProductionYieldReportResponse = ProductionYieldReport & { readonly from: string; readonly to: string };
export type ProductionWasteReportResponse = ProductionWasteReport & { readonly from: string; readonly to: string };
