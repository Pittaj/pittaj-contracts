/**
 * @fileoverview Kits y combos (I9b): qué componentes lleva un producto, cuánto cuesta y qué mueve.
 * @module Contracts/Product/Schemas/ReglasDeComponentes
 *
 * **Espejo exacto en C#**: `Pittaj.Domain/Product/ReglasDeComponentes.cs`, con los mismos vectores
 * (`reglasDeComponentes.test.ts` ↔ `ReglasDeComponentesTests`).
 *
 * - **COMBO** se arma al vender y **no tiene existencia**: lo que el kárdex mueve son sus
 *   componentes. Vender (o devolver) un combo es vender (o devolver) cada componente por su
 *   cantidad, en su unidad base. Eso se resuelve en UN lugar —el que postea las salidas y entradas
 *   de venta (`StockPostingService` en la nube, `StockLedger` en el escritorio)—, así lo cubre
 *   cualquier venta: ticket, apartado, devolución.
 * - **KIT** se arma antes y sí tiene existencia: se vende como cualquier producto. Armarlo y
 *   desarmarlo es su propio documento (I9c). Sus componentes sirven para eso y para saber cuántos
 *   alcanzan.
 *
 * **Grupos de sustitución** (2.84.0): los componentes con el mismo `substituteGroup` son
 * alternativas —refresco de cola **o** de limón—, no se suman. Al vender se mueve **uno** por grupo:
 * el que eligió el cajero o, si no eligió, el primero de la lista. El costo cuenta el primero; cuántos
 * alcanzan suma lo que alcanzan las alternativas del grupo.
 */

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Un componente guardado: cantidad en la unidad elegida (`unitId` nulo = base). */
export interface ComponenteDeProducto {
    readonly productId: string;
    readonly productName: string;
    readonly unitId: string | null;
    readonly quantity: number;
    readonly substituteGroup: string | null;
}

/** Lo que se le pide al catálogo de cada componente para validar la receta. */
export interface ProductoComoComponente {
    readonly id: string;
    readonly type: string;
}

/** Una salida (o entrada) de componente: cuánto, en unidad base, y la semilla de su movimiento. */
export interface MovimientoDeComponente {
    readonly productId: string;
    readonly quantityBase: number;
    readonly seed: string;
}

/** Los tipos que llevan componentes. */
export const TIPOS_CON_COMPONENTES = ['KIT', 'COMBO'] as const;

/**
 * Por qué no se puede guardar esta lista de componentes, o nulo si se puede.
 *
 * - Solo un KIT o un COMBO lleva componentes.
 * - Un producto no es componente de sí mismo, ni aparece dos veces.
 * - Un componente no es un COMBO (no tiene existencia que mover), ni una plantilla VARIABLE (se
 *   vende cada variante), ni un SERVICIO.
 */
export function bloqueoDeComponentes(
    producto: ProductoComoComponente,
    componentes: readonly ComponenteDeProducto[],
    catalogo: ReadonlyMap<string, ProductoComoComponente>
): string | null {
    if (producto.type !== 'KIT' && producto.type !== 'COMBO') return 'Solo un kit o un combo lleva componentes.';
    if (componentes.length === 0) return 'Agrega al menos un componente.';
    const vistos = new Set<string>();
    for (const c of componentes) {
        if (c.productId === producto.id) return 'Un producto no puede ser componente de sí mismo.';
        if (vistos.has(c.productId)) return `«${c.productName}» está dos veces: súmalo en un solo renglón.`;
        vistos.add(c.productId);
        if (!(c.quantity > 0)) return `La cantidad de «${c.productName}» tiene que ser mayor que cero.`;
        const p = catalogo.get(c.productId);
        if (!p) return `«${c.productName}» ya no está en el catálogo.`;
        if (p.type === 'COMBO') return `«${c.productName}» es un combo: no tiene existencia que mover. Usa sus componentes.`;
        if (p.type === 'VARIABLE') return `«${c.productName}» es una plantilla con variantes: elige la variante.`;
        if (p.type === 'SERVICE') return `«${c.productName}» es un servicio: no lleva existencia.`;
    }
    return null;
}

/** Por grupo de sustitución, el componente elegido (`substituteGroup` → `productId`). */
export type EleccionDeComponentes = Readonly<Record<string, string>>;

/** (2.84.0) Los grupos con más de una alternativa, en el orden de la lista: lo que la caja deja elegir. */
export function gruposDeSustitucion(componentes: readonly ComponenteDeProducto[]): { group: string; options: ComponenteDeProducto[] }[] {
    const grupos = new Map<string, ComponenteDeProducto[]>();
    for (const c of componentes) {
        if (!c.substituteGroup) continue;
        grupos.set(c.substituteGroup, [...(grupos.get(c.substituteGroup) ?? []), c]);
    }
    return [...grupos].filter(([, o]) => o.length > 1).map(([group, options]) => ({ group, options }));
}

/**
 * (2.84.0) Los componentes que de verdad se mueven: los que no tienen grupo, y uno por grupo (el
 * elegido si es de ese grupo; si no, el primero). En el orden de la lista.
 */
export function componentesQueSeMueven(
    componentes: readonly ComponenteDeProducto[],
    elegidos: EleccionDeComponentes = {}
): ComponenteDeProducto[] {
    const tomado = new Map<string, string>();
    for (const c of componentes) {
        const g = c.substituteGroup;
        if (!g || tomado.has(g)) continue;
        const elegido = elegidos[g];
        const valido = elegido && componentes.some((x) => x.substituteGroup === g && x.productId === elegido);
        tomado.set(g, valido ? elegido : c.productId);
    }
    return componentes.filter((c) => !c.substituteGroup || tomado.get(c.substituteGroup) === c.productId);
}

/** La semilla del movimiento de un componente, a partir de la del renglón vendido. */
export function semillaDeComponente(seedDelRenglon: string, componentProductId: string): string {
    return `${seedDelRenglon}:component:${componentProductId}`;
}

/**
 * Lo que mueve vender (o devolver) `cantidadBase` de un combo: cada componente por su cantidad × el
 * factor de su unidad × lo vendido, redondeado a 4 decimales. `factores` trae el factor de cada
 * `unitId` (el que falte cuenta como 1).
 */
export function movimientosDeCombo(
    cantidadBase: number,
    componentes: readonly ComponenteDeProducto[],
    factores: ReadonlyMap<string, number>,
    seedDelRenglon: string,
    elegidos: EleccionDeComponentes = {}
): MovimientoDeComponente[] {
    return componentesQueSeMueven(componentes, elegidos).map((c) => ({
        productId: c.productId,
        quantityBase: r4(cantidadBase * c.quantity * (c.unitId ? (factores.get(c.unitId) ?? 1) : 1)),
        seed: semillaDeComponente(seedDelRenglon, c.productId),
    }));
}

/** Costo de un kit o combo armado: Σ cantidad base × costo vigente del componente. */
export function costoDeComponentes(
    componentes: readonly ComponenteDeProducto[],
    factores: ReadonlyMap<string, number>,
    costos: ReadonlyMap<string, number>
): number {
    return r4(componentesQueSeMueven(componentes).reduce((s, c) => s + c.quantity * (c.unitId ? (factores.get(c.unitId) ?? 1) : 1) * (costos.get(c.productId) ?? 0), 0));
}

/** Cuántos se pueden armar con lo que hay: el componente que menos alcanza (nunca negativo). */
export function cuantosAlcanzan(
    componentes: readonly ComponenteDeProducto[],
    factores: ReadonlyMap<string, number>,
    existencias: ReadonlyMap<string, number>
): number {
    if (componentes.length === 0) return 0;
    const alcanza = (c: ComponenteDeProducto) => {
        const porUno = c.quantity * (c.unitId ? (factores.get(c.unitId) ?? 1) : 1);
        return porUno <= 0 ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor(r4((existencias.get(c.productId) ?? 0) / porUno)));
    };
    let min = Number.POSITIVE_INFINITY;
    const grupos = new Map<string, number>();
    for (const c of componentes) {
        // Un grupo alcanza lo que suman sus alternativas.
        if (c.substituteGroup) grupos.set(c.substituteGroup, (grupos.get(c.substituteGroup) ?? 0) + alcanza(c));
        else min = Math.min(min, alcanza(c));
    }
    for (const g of grupos.values()) min = Math.min(min, g);
    return Number.isFinite(min) ? Math.max(0, min) : 0;
}

/**
 * (2.84.0) Fusión de productos: la lista de componentes con el duplicado re-apuntado al que queda.
 * La cantidad del duplicado pasa a unidad base (su unidad era suya, no del superviviente); si el que
 * queda ya estaba en la lista, se le suma en **su** unidad. Nulo si el duplicado no estaba.
 */
export function componentesTrasFusion(
    componentes: readonly ComponenteDeProducto[],
    duplicateId: string,
    survivor: { readonly id: string; readonly name: string },
    factores: ReadonlyMap<string, number>
): ComponenteDeProducto[] | null {
    const dup = componentes.find((c) => c.productId === duplicateId);
    if (!dup) return null;
    const base = r4(dup.quantity * (dup.unitId ? (factores.get(dup.unitId) ?? 1) : 1));
    const ya = componentes.find((c) => c.productId === survivor.id);
    if (ya) {
        const f = ya.unitId ? (factores.get(ya.unitId) ?? 1) : 1;
        return componentes
            .filter((c) => c.productId !== duplicateId)
            .map((c) => (c.productId === survivor.id ? { ...c, quantity: r4(c.quantity + base / f) } : c));
    }
    return componentes.map((c) =>
        c.productId === duplicateId ? { ...c, productId: survivor.id, productName: survivor.name, unitId: null, quantity: base } : c
    );
}
