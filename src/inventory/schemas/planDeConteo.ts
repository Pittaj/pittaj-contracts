/**
 * @fileoverview El plan de conteo cíclico (I6b): qué entra a la tanda de hoy, cuándo toca la
 * siguiente y cuánto del plan está al día.
 * @module Contracts/Inventory/Schemas/PlanDeConteo
 *
 * **Espejo exacto en el escritorio** (`Pittaj.Domain.Inventory.PlanDeConteo`), con los mismos
 * vectores. La tanda la puede generar cualquier punta —la nube o un escritorio sin red—, y las dos
 * tienen que elegir los mismos productos para el mismo plan, la misma ronda y la misma semilla.
 *
 * ── Qué entra a la tanda ──
 *
 * 1. **Primero lo urgente**, si el plan lo pide: lo que está en negativo (un negativo siempre es un
 *    error de conteo o de captura) y lo que tuvo diferencia en su último conteo.
 * 2. **Luego la estrategia:**
 *    - `ABC`: lo vencido, el que más se pasó de su frecuencia primero (nunca contado = el más
 *      vencido; empatados, A antes que B antes que C).
 *    - `CATEGORY_ROTATION`: la categoría que toca en esta ronda (`ronda % categorías`); dentro, lo
 *      que hace más que no se cuenta.
 *    - `RANDOM`: un sorteo con semilla (el id del conteo): reproducible, no `Math.random`.
 * 3. Hasta `itemsPerRun`, sin repetir.
 *
 * La población de `ABC`, `RANDOM` y de la cobertura es la de «toda la bodega» (I6a): lo que tiene
 * existencia o nivel. `CATEGORY_ROTATION` toma la categoría entera, aunque esté en cero.
 *
 * ── Lo que NO se guarda ──
 *
 * Mandato de paridad §4: el plan es configuración. La ronda, la última tanda y la cobertura se
 * **derivan** de los conteos que llevan su `countPlanId`; un contador guardado se desincroniza en
 * cuanto una punta genera una tanda sin red.
 */

import type { AbcClass, CountPlanStrategy } from './countPlan.schema.js';

/** Un producto de la bodega del plan, con lo que la tanda necesita saber de él. */
export interface ProductoDelPlan {
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    readonly categoryId: string | null;
    readonly existencia: number;
    readonly tieneNivel: boolean;
    /** Lo que no se vendió en la ventana es C. */
    readonly abcClass: AbcClass;
    /** `YYYY-MM-DD` del último conteo aplicado en la bodega; `null` = nunca. */
    readonly ultimoConteo: string | null;
    /** Ese último conteo tuvo diferencia. */
    readonly ultimaDiferencia: boolean;
}

export interface PlanParaTanda {
    readonly strategy: CountPlanStrategy;
    readonly frequencyDays: { readonly A: number; readonly B: number; readonly C: number } | null;
    readonly categoryIds: readonly string[];
    readonly itemsPerRun: number;
    readonly includeLastDiscrepancies: boolean;
    readonly includeNegatives: boolean;
}

export const FRECUENCIA_POR_OMISION = { A: 30, B: 90, C: 180 } as const;

const ORDEN_DE_CLASE: Record<AbcClass, number> = { A: 0, B: 1, C: 2 };

/** Días civiles de `desde` a `hasta` (`YYYY-MM-DD`). */
export function diasEntre(desde: string, hasta: string): number {
    return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

/** FNV-1a de 32 bits sobre UTF-8: el sorteo de `RANDOM`. Idéntico en C#. */
export function fnv1a(texto: string): number {
    let h = 0x811c9dc5;
    const byte = (b: number) => {
        h ^= b;
        h = Math.imul(h, 0x01000193) >>> 0;
    };
    // UTF-8 a mano: contratos no carga `TextEncoder` (no hay DOM en su `lib`).
    for (const ch of texto) {
        const c = ch.codePointAt(0)!;
        if (c < 0x80) byte(c);
        else if (c < 0x800) { byte(0xc0 | (c >> 6)); byte(0x80 | (c & 0x3f)); }
        else if (c < 0x10000) { byte(0xe0 | (c >> 12)); byte(0x80 | ((c >> 6) & 0x3f)); byte(0x80 | (c & 0x3f)); }
        else { byte(0xf0 | (c >> 18)); byte(0x80 | ((c >> 12) & 0x3f)); byte(0x80 | ((c >> 6) & 0x3f)); byte(0x80 | (c & 0x3f)); }
    }
    return h >>> 0;
}

const porNombre = (a: ProductoDelPlan, b: ProductoDelPlan) =>
    a.productName.localeCompare(b.productName, 'es') || (a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0);

/** Lo que tiene existencia o nivel: la población de «toda la bodega». */
const enLaBodega = (p: ProductoDelPlan) => p.existencia !== 0 || p.tieneNivel;

/** Qué tan vencido está: días desde el último conteo entre su frecuencia; nunca contado = ∞. */
function vencimiento(p: ProductoDelPlan, frecuencia: PlanParaTanda['frequencyDays'], hoy: string): number {
    if (p.ultimoConteo === null) return Number.POSITIVE_INFINITY;
    const f = (frecuencia ?? FRECUENCIA_POR_OMISION)[p.abcClass];
    return diasEntre(p.ultimoConteo, hoy) / f;
}

/** Los productos de la tanda, en el orden en que se cuentan. */
export function tandaDelPlan(
    plan: PlanParaTanda,
    productos: readonly ProductoDelPlan[],
    contexto: { readonly hoy: string; readonly ronda: number; readonly semilla: string }
): ProductoDelPlan[] {
    const urgentes: ProductoDelPlan[] = [];
    if (plan.includeNegatives) urgentes.push(...productos.filter((p) => p.existencia < 0).sort(porNombre));
    if (plan.includeLastDiscrepancies) urgentes.push(...productos.filter((p) => p.ultimaDiferencia).sort(porNombre));

    let estrategia: ProductoDelPlan[];
    if (plan.strategy === 'ABC') {
        estrategia = productos
            .filter(enLaBodega)
            .map((p) => ({ p, v: vencimiento(p, plan.frequencyDays, contexto.hoy) }))
            .filter((x) => x.v >= 1)
            .sort((a, b) => {
                if (a.v !== b.v) return a.v === Number.POSITIVE_INFINITY ? -1 : b.v === Number.POSITIVE_INFINITY ? 1 : b.v - a.v;
                return ORDEN_DE_CLASE[a.p.abcClass] - ORDEN_DE_CLASE[b.p.abcClass] || porNombre(a.p, b.p);
            })
            .map((x) => x.p);
    } else if (plan.strategy === 'CATEGORY_ROTATION') {
        if (plan.categoryIds.length === 0) estrategia = [];
        else {
            const cat = plan.categoryIds[((contexto.ronda % plan.categoryIds.length) + plan.categoryIds.length) % plan.categoryIds.length];
            estrategia = productos
                .filter((p) => p.categoryId === cat)
                .sort((a, b) => {
                    if (a.ultimoConteo !== b.ultimoConteo) {
                        if (a.ultimoConteo === null) return -1;
                        if (b.ultimoConteo === null) return 1;
                        return a.ultimoConteo < b.ultimoConteo ? -1 : 1;
                    }
                    return porNombre(a, b);
                });
        }
    } else {
        estrategia = productos
            .filter(enLaBodega)
            .map((p) => ({ p, h: fnv1a(`${contexto.semilla}:${p.productId}`) }))
            .sort((a, b) => a.h - b.h || (a.p.productId < b.p.productId ? -1 : 1))
            .map((x) => x.p);
    }

    const vistos = new Set<string>();
    const tanda: ProductoDelPlan[] = [];
    for (const p of [...urgentes, ...estrategia]) {
        if (tanda.length >= plan.itemsPerRun) break;
        if (vistos.has(p.productId)) continue;
        vistos.add(p.productId);
        tanda.push(p);
    }
    return tanda;
}

/** Día de la semana de `YYYY-MM-DD` (0 = domingo). */
export function diaDeLaSemana(fecha: string): number {
    return new Date(`${fecha}T00:00:00Z`).getUTCDay();
}

const masDias = (fecha: string, n: number) => new Date(Date.parse(`${fecha}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/**
 * La próxima tanda: el primer día de la semana elegido desde hoy, o desde mañana si hoy ya se
 * generó una. Sin días elegidos, nunca (`null`).
 */
export function proximaTanda(weekdays: readonly number[], ultima: string | null, hoy: string): string | null {
    if (weekdays.length === 0) return null;
    const dias = new Set(weekdays);
    const desde = ultima !== null && ultima >= hoy ? masDias(hoy, 1) : hoy;
    for (let i = 0; i < 7; i++) {
        const f = masDias(desde, i);
        if (dias.has(diaDeLaSemana(f))) return f;
    }
    return null;
}

export interface CoberturaDeClase {
    readonly abcClass: AbcClass;
    readonly products: number;
    readonly countedOnTime: number;
    readonly overdue: number;
    /** Del último conteo de cada producto: los que cuadraron entre los contados. */
    readonly accuracy: number | null;
}

/** Cuánto del plan está al día, por clase, sobre lo que tiene existencia o nivel. */
export function coberturaDelPlan(
    productos: readonly ProductoDelPlan[],
    frecuencia: PlanParaTanda['frequencyDays'],
    hoy: string
): CoberturaDeClase[] {
    const f = frecuencia ?? FRECUENCIA_POR_OMISION;
    return (['A', 'B', 'C'] as const).map((abcClass) => {
        const deLaClase = productos.filter((p) => enLaBodega(p) && p.abcClass === abcClass);
        const contados = deLaClase.filter((p) => p.ultimoConteo !== null);
        const aTiempo = contados.filter((p) => diasEntre(p.ultimoConteo!, hoy) < f[abcClass]).length;
        const cuadraron = contados.filter((p) => !p.ultimaDiferencia).length;
        return {
            abcClass,
            products: deLaClase.length,
            countedOnTime: aTiempo,
            overdue: deLaClase.length - aTiempo,
            accuracy: contados.length > 0 ? Math.round((cuadraron / contados.length) * 10_000) / 10_000 : null,
        };
    });
}
