/**
 * @fileoverview Armado y desarmado de kits (I9c): qué sale, qué entra y a qué costo.
 * @module Contracts/Product/Schemas/ReglasDeArmado
 *
 * **Espejo exacto en C#**: `Pittaj.Domain/Product/ReglasDeArmado.cs`, con los mismos vectores.
 *
 * - **Armar N** saca de la bodega cada componente (cantidad × factor × N, en unidad base) a su
 *   costo promedio vigente, y mete N kits al costo sumado ÷ N. No se arma con lo que no hay.
 * - **Desarmar N** (cantidad negativa) saca N kits a su costo promedio y devuelve cada componente
 *   a su costo promedio vigente. No se desarma lo que no está armado.
 *
 * Todos los movimientos son `PRODUCTION` con id determinista (`stock:kit-assembly:{id}:{producto}`),
 * así reintentar el mismo armado no duplica nada. Contabilidad lo trata como una orden de un
 * renglón: con componentes y kit en la misma cuenta no hay nada que asentar.
 */

import type { ComponenteDeProducto } from './reglasDeComponentes.js';

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Lo que hay de un producto en la bodega del armado. `cost` = promedio vigente, o el de la ficha. */
export interface ExistenciaParaArmado {
    readonly onHand: number;
    readonly cost: number;
}

export interface MovimientoDeArmado {
    readonly productId: string;
    readonly direction: 'IN' | 'OUT';
    readonly quantity: number;
    readonly unitCost: number;
    readonly seed: string;
}

export interface PlanDeArmado {
    /** Por qué no se puede, o nulo. */
    readonly bloqueo: string | null;
    /** Costo unitario del kit en este documento. */
    readonly unitCost: number;
    /** Lo que se consumió (armar) o devolvió (desarmar) de cada componente, en unidad base. */
    readonly components: readonly { productId: string; productName: string; quantity: number; unitCost: number }[];
    readonly movimientos: readonly MovimientoDeArmado[];
}

export function semillaDeArmado(assemblyId: string, productId: string): string {
    return `stock:kit-assembly:${assemblyId}:${productId}`;
}

export function planDeArmado(p: {
    readonly assemblyId: string;
    readonly kit: { readonly id: string; readonly name: string };
    readonly cantidad: number;
    readonly componentes: readonly ComponenteDeProducto[];
    readonly factores: ReadonlyMap<string, number>;
    readonly existencias: ReadonlyMap<string, ExistenciaParaArmado>;
}): PlanDeArmado {
    const vacio = (bloqueo: string): PlanDeArmado => ({ bloqueo, unitCost: 0, components: [], movimientos: [] });
    if (p.cantidad === 0) return vacio('Armar cero no arma nada.');
    if (p.componentes.length === 0) return vacio(`«${p.kit.name}» no tiene componentes: agrégalos antes de armarlo.`);
    const n = Math.abs(p.cantidad);
    const de = (id: string) => p.existencias.get(id) ?? { onHand: 0, cost: 0 };
    const usados = p.componentes.map((c) => {
        const porUno = c.quantity * (c.unitId ? (p.factores.get(c.unitId) ?? 1) : 1);
        return { productId: c.productId, productName: c.productName, quantity: r4(porUno * n), unitCost: r4(de(c.productId).cost) };
    });

    if (p.cantidad > 0) {
        for (const u of usados) {
            const hay = de(u.productId).onHand;
            if (hay < u.quantity) return vacio(`«${u.productName}»: hay ${r4(hay)} y se necesitan ${u.quantity}.`);
        }
        const total = usados.reduce((s, u) => s + u.quantity * u.unitCost, 0);
        const unitCost = r4(total / n);
        return {
            bloqueo: null,
            unitCost,
            components: usados,
            movimientos: [
                ...usados.map((u) => ({ productId: u.productId, direction: 'OUT' as const, quantity: u.quantity, unitCost: u.unitCost, seed: semillaDeArmado(p.assemblyId, u.productId) })),
                { productId: p.kit.id, direction: 'IN' as const, quantity: n, unitCost, seed: semillaDeArmado(p.assemblyId, p.kit.id) },
            ],
        };
    }

    const kit = de(p.kit.id);
    if (kit.onHand < n) return vacio(`De «${p.kit.name}» hay ${r4(kit.onHand)} armados y se quieren desarmar ${n}.`);
    const unitCost = r4(kit.cost);
    return {
        bloqueo: null,
        unitCost,
        components: usados,
        movimientos: [
            { productId: p.kit.id, direction: 'OUT' as const, quantity: n, unitCost, seed: semillaDeArmado(p.assemblyId, p.kit.id) },
            ...usados.map((u) => ({ productId: u.productId, direction: 'IN' as const, quantity: u.quantity, unitCost: u.unitCost, seed: semillaDeArmado(p.assemblyId, u.productId) })),
        ],
    };
}
