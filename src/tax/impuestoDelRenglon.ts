/**
 * @fileoverview D7a · El impuesto de un renglón de venta y lo que su concepto lleva en el CFDI.
 * @module Contracts/Tax
 *
 * Dos momentos, una sola regla:
 *
 * 1. **Al vender** (`snapshotDelImpuesto`): el punto de venta —web o escritorio— copia al renglón
 *    el impuesto del catálogo como código y factor del SAT. Es lo único que el CFDI va a poder
 *    decir después, así que tiene que distinguir cuatro cosas que antes se confundían:
 *
 *    | Del catálogo | `taxCode` | `taxFactor` | En el CFDI |
 *    |---|---|---|---|
 *    | IVA 16 % / 8 % | `002` | `Tasa` | `ObjetoImp 02`, IVA a la tasa |
 *    | Tasa 0 (leche, frijol, medicinas) | `002` | `Tasa` | `ObjetoImp 02`, IVA al 0 % |
 *    | Exento (renta de casa habitación, colegiaturas) | `002` | `Exento` | `ObjetoImp 02`, IVA exento, sin importe |
 *    | No objeto (cuotas, donativos, lo que no es acto gravado) | `null` | `null` | `ObjetoImp 01`, sin nodo de impuestos |
 *
 *    El escritorio guardaba tasa 0 como `(null, "Tasa")` y exento como `(null, "Exento")`; la caja
 *    web no guardaba nada. `impuestoDelRenglon` lee también esas filas viejas.
 *
 * 2. **Al timbrar** (`impuestoDelRenglon` → `trasladosDelConcepto`): del renglón guardado salen el
 *    `ObjetoImp` y los traslados del concepto. Antes, «tasa 0» se timbraba `01` (no objeto): la
 *    leche del abarrote dejaba de contar como acto gravado al 0 % en la declaración de IVA del
 *    cliente y en la propia.
 *
 * La gemela del paso 1 en el escritorio es `Pittaj.Domain/Tax/ImpuestoDelRenglon.cs`.
 */
import type { TaxKind } from './schemas/createTax.schema.js';

/** c_ObjetoImp. D7a usa `01` y `02`; `03`–`05` llegan en D7e. */
export type ObjetoImp = '01' | '02' | '03' | '04' | '05';

/** c_Impuesto que se trasladan en una venta. */
export type ImpuestoTrasladado = '002' | '003';

/** c_TipoFactor. */
export type TipoFactor = 'Tasa' | 'Cuota' | 'Exento';

/** El impuesto como lo copia el punto de venta al renglón. */
export interface SnapshotDelImpuesto {
    readonly taxCode: ImpuestoTrasladado | null;
    readonly taxFactor: TipoFactor | null;
}

/** Lo que el punto de venta copia del catálogo al renglón (paso 1). */
export function snapshotDelImpuesto(
    kind: TaxKind | string,
    satCode?: string | null,
    satFactor?: string | null,
): SnapshotDelImpuesto {
    switch (kind) {
        case 'IVA':
            return { taxCode: '002', taxFactor: satFactor === 'Cuota' ? 'Cuota' : 'Tasa' };
        case 'IEPS':
            return { taxCode: '003', taxFactor: satFactor === 'Cuota' ? 'Cuota' : 'Tasa' };
        case 'ZERO':
            return { taxCode: '002', taxFactor: 'Tasa' };
        case 'EXEMPT':
            return { taxCode: '002', taxFactor: 'Exento' };
        case 'NOT_OBJECT':
            return { taxCode: null, taxFactor: null };
        default:
            // Un tipo que este código no conoce: lo que diga el catálogo, y si no dice, IVA.
            return {
                taxCode: satCode === '003' ? '003' : '002',
                taxFactor: satFactor === 'Exento' ? 'Exento' : satFactor === 'Cuota' ? 'Cuota' : 'Tasa',
            };
    }
}

/** El renglón guardado, lo que haga falta de él. */
export interface RenglonConImpuesto {
    readonly taxCode?: string | null;
    readonly taxFactor?: string | null;
    /** Fracción (0.16) o porcentaje (16): la caja web vieja guardaba porcentaje. Cuota: tal cual. */
    readonly taxPercent: number;
    readonly taxAmount?: number | null;
}

/** El impuesto de un renglón ya clasificado (paso 2). */
export interface ImpuestoDelRenglon {
    readonly objetoImp: ObjetoImp;
    /** `null` solo con `ObjetoImp` distinto de `02`. */
    readonly impuesto: ImpuestoTrasladado | null;
    readonly tipoFactor: TipoFactor | null;
    /** Fracción (0.16) o cuota por unidad; `null` si es exento o no objeto. */
    readonly tasaOCuota: number | null;
}

const normalizarFactor = (f: string | null | undefined): TipoFactor | null => {
    const v = (f ?? '').trim().toLowerCase();
    if (v === 'tasa') return 'Tasa';
    if (v === 'cuota') return 'Cuota';
    if (v === 'exento') return 'Exento';
    return null;
};

/** Ningún impuesto real vive entre 1 y 100 expresado como fracción: >1 es porcentaje. */
const comoFraccion = (tasa: number): number => (tasa > 1 ? Math.round(tasa * 100) / 10_000 : tasa);

/**
 * Clasifica el impuesto de un renglón guardado. Lee el renglón nuevo (`snapshotDelImpuesto`) y las
 * filas de antes de D7a:
 *
 * - `(null, "Tasa")` del escritorio = tasa 0 → IVA 0 %, objeto.
 * - `(null, "Exento")` del escritorio = exento.
 * - `(null, null)` con tasa o IVA > 0 = la caja web vieja → IVA a esa tasa.
 * - `(null, null)` sin tasa ni IVA → no objeto.
 */
export function impuestoDelRenglon(r: RenglonConImpuesto): ImpuestoDelRenglon {
    const factor = normalizarFactor(r.taxFactor);
    const code = (r.taxCode ?? '').trim();
    const taxAmount = r.taxAmount ?? 0;

    if (factor === 'Exento') return { objetoImp: '02', impuesto: '002', tipoFactor: 'Exento', tasaOCuota: null };

    if (code === '003') {
        const tipo = factor === 'Cuota' ? 'Cuota' : 'Tasa';
        return { objetoImp: '02', impuesto: '003', tipoFactor: tipo, tasaOCuota: tipo === 'Cuota' ? r.taxPercent : comoFraccion(r.taxPercent) };
    }
    if (code === '002' || factor === 'Tasa' || factor === 'Cuota') {
        return { objetoImp: '02', impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: comoFraccion(r.taxPercent) };
    }
    if (r.taxPercent > 0 || taxAmount > 0) {
        return { objetoImp: '02', impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: comoFraccion(r.taxPercent) };
    }
    return { objetoImp: '01', impuesto: null, tipoFactor: null, tasaOCuota: null };
}

/** Un traslado del concepto (o del comprobante, agrupado). */
export interface TrasladoDelConcepto {
    readonly impuesto: ImpuestoTrasladado;
    readonly tipoFactor: TipoFactor;
    /** `null` en exento. */
    readonly tasaOCuota: number | null;
    readonly base: number;
    /** `null` en exento: el SAT no admite importe con factor Exento. */
    readonly importe: number | null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Los traslados del concepto: ninguno si no es `ObjetoImp 02`. */
export function trasladosDelConcepto(imp: ImpuestoDelRenglon, base: number, importe: number): TrasladoDelConcepto[] {
    if (imp.objetoImp !== '02' || !imp.impuesto || !imp.tipoFactor) return [];
    if (imp.tipoFactor === 'Exento') {
        return [{ impuesto: imp.impuesto, tipoFactor: 'Exento', tasaOCuota: null, base: r2(base), importe: null }];
    }
    return [{ impuesto: imp.impuesto, tipoFactor: imp.tipoFactor, tasaOCuota: imp.tasaOCuota ?? 0, base: r2(base), importe: r2(importe) }];
}

/**
 * Agrupa traslados por impuesto, factor y tasa, sumando base e importe: el nodo de impuestos del
 * comprobante, el concepto de una venta en la factura global y el desglose de un pago (REP).
 */
export function agruparTraslados(traslados: readonly TrasladoDelConcepto[]): TrasladoDelConcepto[] {
    const grupos = new Map<string, { base: number; importe: number | null; t: TrasladoDelConcepto }>();
    for (const t of traslados) {
        const clave = `${t.impuesto}|${t.tipoFactor}|${t.tasaOCuota ?? ''}`;
        const g = grupos.get(clave);
        if (g) {
            g.base += t.base;
            g.importe = t.importe === null ? null : (g.importe ?? 0) + t.importe;
        } else {
            grupos.set(clave, { base: t.base, importe: t.importe, t });
        }
    }
    return [...grupos.values()].map(({ base, importe, t }) => ({
        impuesto: t.impuesto,
        tipoFactor: t.tipoFactor,
        tasaOCuota: t.tasaOCuota,
        base: r2(base),
        importe: importe === null ? null : r2(importe),
    }));
}

/** Suma de los importes trasladados (los exentos no suman). */
export function totalTrasladado(traslados: readonly TrasladoDelConcepto[]): number {
    return r2(traslados.reduce((s, t) => s + (t.importe ?? 0), 0));
}

/**
 * El `ObjetoImp` de un concepto que resume varios renglones (una venta en la factura global, un
 * documento en un pago): `02` si alguno lo es, `01` si ninguno.
 */
export function objetoImpDelResumen(objetos: readonly ObjetoImp[]): ObjetoImp {
    return objetos.some((o) => o === '02') ? '02' : objetos[0] ?? '01';
}

/**
 * Los traslados de un documento en la proporción de un abono (el desglose «DR» del complemento de
 * pago): cada traslado conserva su impuesto, factor y tasa; base e importe se escalan.
 */
export function prorratearTraslados(traslados: readonly TrasladoDelConcepto[], proporcion: number): TrasladoDelConcepto[] {
    const p = Math.max(0, Math.min(1, proporcion));
    return traslados.map((t) => ({
        ...t,
        base: r2(t.base * p),
        importe: t.importe === null ? null : r2(t.importe * p),
    }));
}
