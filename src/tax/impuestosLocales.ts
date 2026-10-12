/**
 * @fileoverview D7d · Impuestos locales en el CFDI de venta (complemento `implocal`).
 * @module Contracts/Tax
 *
 * Los estados y municipios cobran impuestos que el CFDI federal no tiene en su catálogo: el de
 * hospedaje (ISH, 2–5 % según el estado), el de espectáculos, y retenciones cedulares sobre
 * honorarios o arrendamiento. Viajan en el complemento «Impuestos Locales» (SAT, `implocal` 1.0):
 *
 * - `TrasladosLocales` (`ImpLocTrasladado`, `TasadeTraslado`, `Importe`) y
 *   `RetencionesLocales` (`ImpLocRetenido`, `TasadeRetencion`, `Importe`), con su total cada uno.
 * - El `Total` del comprobante **los suma o resta**: Total = SubTotal − Descuento + traslados
 *   federales − retenciones federales + traslados locales − retenciones locales.
 * - **No** entran en la base del IVA (LIVA art. 18 grava el valor de la contraprestación, no los
 *   impuestos locales que se trasladan aparte).
 *
 * El nombre es libre (el complemento no tiene catálogo): se usa el del impuesto del catálogo.
 * La tasa va en por ciento en el complemento (3.00 = 3 %); aquí se guarda como fracción.
 */

export interface ImpuestoLocalDelConcepto {
    /** Nombre del impuesto local, tal como lo pide la ley que lo crea («ISH», «Cedular»). */
    readonly nombre: string;
    readonly tipo: 'TRASLADO' | 'RETENCION';
    /** Fracción (0.03). */
    readonly tasa: number;
    readonly base: number;
    readonly importe: number;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const r6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000;

/** Un impuesto local de un concepto: importe = base × tasa. */
export function impuestoLocal(
    nombre: string,
    tipo: 'TRASLADO' | 'RETENCION',
    tasa: number,
    base: number,
    importe?: number,
): ImpuestoLocalDelConcepto {
    return { nombre: nombre.trim(), tipo, tasa: r6(tasa), base: r2(base), importe: r2(importe ?? base * tasa) };
}

/** Agrupa por nombre, tipo y tasa (el complemento lleva un nodo por impuesto y tasa). */
export function agruparImpuestosLocales(xs: readonly ImpuestoLocalDelConcepto[]): ImpuestoLocalDelConcepto[] {
    const g = new Map<string, ImpuestoLocalDelConcepto>();
    for (const x of xs) {
        const k = `${x.tipo}|${x.nombre}|${x.tasa}`;
        const a = g.get(k);
        g.set(k, a ? { ...a, base: r2(a.base + x.base), importe: r2(a.importe + x.importe) } : x);
    }
    return [...g.values()];
}

export function totalTrasladosLocales(xs: readonly ImpuestoLocalDelConcepto[]): number {
    return r2(xs.filter((x) => x.tipo === 'TRASLADO').reduce((s, x) => s + x.importe, 0));
}

export function totalRetencionesLocales(xs: readonly ImpuestoLocalDelConcepto[]): number {
    return r2(xs.filter((x) => x.tipo === 'RETENCION').reduce((s, x) => s + x.importe, 0));
}

/** Los impuestos locales de un documento en la proporción de un abono o de una devolución. */
export function prorratearImpuestosLocales(xs: readonly ImpuestoLocalDelConcepto[], proporcion: number): ImpuestoLocalDelConcepto[] {
    const p = Math.max(0, Math.min(1, proporcion));
    return xs.map((x) => ({ ...x, base: r2(x.base * p), importe: r2(x.importe * p) }));
}
