/**
 * @fileoverview El conteo físico por alcance, ciego y con escáner (I6a): las reglas que comparten
 * la nube y el escritorio.
 * @module Contracts/Inventory/Schemas/ReglasDeConteo
 *
 * **Espejo exacto en el escritorio** (`Pittaj.Domain.Inventory.ReglasDeConteo`), con los mismos
 * vectores de prueba. Un conteo se empieza en una punta y se termina en la otra: si las dos precargan
 * renglones distintos, o suman una lectura distinto, el conteo deja de valer en las dos.
 *
 * ── El alcance decide qué se precarga ──
 *
 * - `FULL`: lo que tiene existencia (positiva o negativa) o un nivel en la bodega. Lo que no tiene
 *   nada no se cuenta: llenaría la hoja de ceros.
 * - `CATEGORY`: todo lo de las categorías elegidas, **aunque esté en cero**. Quien cuenta una
 *   categoría busca lo que se acomodó mal, y eso a veces es justo lo que el sistema cree agotado.
 * - `PARTIAL` y `CYCLIC`: nada. El primero se llena escaneando; el segundo lo llena su plan (I6b).
 *
 * Los candidatos ya vienen filtrados: activos y con inventario. Los renglones salen ordenados por
 * nombre (en español) y, empatados, por id, para que las dos puntas los enseñen igual.
 *
 * ── Ciego ──
 *
 * Quien ve «deberían ser 12» cuenta 12. En un conteo ciego **no se enseña el teórico ni la
 * diferencia mientras se captura**; al cerrar la captura aparecen, y se revisa antes de aplicar.
 * Aplicar uno ciego sin cerrar la captura no se permite: sería aplicar diferencias que nadie miró.
 * Es disciplina de captura, no un candado: quien tiene permiso de ver existencias las sigue viendo
 * en su pantalla.
 */

import type { StockCountScope } from './stockAdjustment.schema.js';

const r4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** Un producto que podría entrar al conteo. */
export interface CandidatoDeConteo {
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    readonly categoryId: string | null;
    /** Existencia en la bodega del conteo (0 si no hay registro). */
    readonly existencia: number;
    /** Tiene nivel (mínimo, reorden o máximo) en esa bodega. */
    readonly tieneNivel: boolean;
}

/** Los productos que precarga un alcance, en el orden en que se cuentan. */
export function renglonesDelAlcance(
    scope: StockCountScope,
    candidatos: readonly CandidatoDeConteo[],
    categoryIds: readonly string[] = []
): CandidatoDeConteo[] {
    let elegidos: CandidatoDeConteo[];
    if (scope === 'FULL') {
        elegidos = candidatos.filter((c) => c.existencia !== 0 || c.tieneNivel);
    } else if (scope === 'CATEGORY') {
        const cats = new Set(categoryIds);
        elegidos = candidatos.filter((c) => c.categoryId !== null && cats.has(c.categoryId));
    } else {
        return [];
    }
    return [...elegidos].sort(
        (a, b) => a.productName.localeCompare(b.productName, 'es') || (a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0)
    );
}

/** Piezas que suma una lectura: la cantidad por el factor de la presentación escaneada (caja de 12). */
export function piezasDeLectura(cantidad: number, factor: number | null | undefined): number {
    return r4(cantidad * (factor && factor > 0 ? factor : 1));
}

/**
 * Lo contado después de una lectura. Una lectura negativa corrige: nunca deja el renglón bajo cero,
 * y sobre un renglón sin contar no lo marca contado.
 */
export function sumarLectura(contado: number | null, piezas: number): number | null {
    if (contado === null && piezas <= 0) return null;
    return Math.max(0, r4((contado ?? 0) + piezas));
}

/** Si la pantalla puede enseñar el teórico y la diferencia de un conteo. */
export function seVeElTeorico(conteo: {
    readonly blind?: boolean;
    readonly status: string;
    readonly captureClosedAt?: string | Date | null;
}): boolean {
    return !conteo.blind || conteo.status !== 'DRAFT' || Boolean(conteo.captureClosedAt);
}

/** Por qué no se puede aplicar todavía un conteo ciego; `null` si se puede. */
export function bloqueoDeConteoCiego(conteo: {
    readonly blind?: boolean;
    readonly captureClosedAt?: string | Date | null;
}): string | null {
    return conteo.blind && !conteo.captureClosedAt
        ? 'Es un conteo ciego: cierra la captura para revisar las diferencias antes de aplicar.'
        : null;
}

/** El nombre de cada alcance, para las dos pantallas. */
export const STOCK_COUNT_SCOPE_LABELS: Readonly<Record<StockCountScope, string>> = {
    FULL: 'Toda la bodega',
    CATEGORY: 'Por categoría',
    PARTIAL: 'Lo que se escanee',
    CYCLIC: 'Cíclico',
};
