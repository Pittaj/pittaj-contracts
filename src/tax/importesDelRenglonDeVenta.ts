/**
 * @fileoverview D7b · Los importes de un renglón de venta con IVA **e** IEPS.
 * @module Contracts/Tax
 *
 * Un refresco, una botana, un cigarro o un litro de gasolina llevan los dos impuestos a la vez. El
 * IEPS va sobre la base; el IVA, sobre **la base más el IEPS** (LIVA art. 12). El IEPS puede ser:
 *
 * - **por tasa** — un porcentaje de la base (botanas 8 %, bebidas alcohólicas 26.5 %, tabaco 160 %);
 * - **por cuota** — pesos por unidad (refrescos $1.6451 por litro, gasolina por litro, cigarros por
 *   pieza). La cuota se multiplica por las unidades base vendidas (`cantidad × factor de unidad`).
 *
 * Con precio **con impuestos incluidos** (el de etiqueta) se despeja la base para que el total sea
 * exactamente el de etiqueta; el centavo de redondeo cae en el IVA, como hoy.
 *
 * El escritorio y la nube calculan igual: la gemela es `Pittaj.Domain/PosTicket/ImportesDeVenta.cs`
 * y los vectores son los mismos.
 */

export type FactorDeIeps = 'Tasa' | 'Cuota';

export interface RenglonDeVentaParaCalcular {
    readonly cantidad: number;
    /** Unidades base por unidad vendida (una caja de 12 = 12). La cuota de IEPS se cobra por unidad base. */
    readonly factorDeUnidad?: number;
    readonly precioUnitario: number;
    /** 0–100. */
    readonly descuentoPorcentaje?: number;
    /** Tasa de IVA como fracción (0.16). 0 para tasa 0, exento o no objeto. */
    readonly tasaIva: number;
    /** IEPS del producto; ausente = no lleva. */
    readonly ieps?: { readonly factor: FactorDeIeps; readonly tasaOCuota: number } | null;
    /** El precio ya trae los impuestos (precio de etiqueta). */
    readonly impuestosIncluidos: boolean;
}

export interface ImportesDelRenglonDeVenta {
    /** Cantidad × precio, sin impuestos (con impuestos incluidos: base + descuento). */
    readonly subtotal: number;
    readonly descuento: number;
    /** Subtotal − descuento: la base del IEPS. */
    readonly base: number;
    readonly ieps: number;
    /** Base + IEPS: la base del IVA. */
    readonly baseIva: number;
    readonly iva: number;
    readonly total: number;
    /** Unidades base sobre las que se cobró la cuota (la «Base» del IEPS por cuota en el CFDI). */
    readonly unidadesDeCuota: number;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function importesDelRenglonDeVenta(r: RenglonDeVentaParaCalcular): ImportesDelRenglonDeVenta {
    const bruto = r.cantidad * r.precioUnitario;
    const descuento = r2((bruto * (r.descuentoPorcentaje ?? 0)) / 100);
    const unidades = r.cantidad * (r.factorDeUnidad && r.factorDeUnidad > 0 ? r.factorDeUnidad : 1);
    const v = r.tasaIva;
    const ieps = r.ieps && r.ieps.tasaOCuota > 0 ? r.ieps : null;

    if (r.impuestosIncluidos) {
        const total = r2(bruto - descuento);
        let base: number;
        let iepsImporte: number;
        if (ieps?.factor === 'Tasa') {
            base = r2(total / ((1 + ieps.tasaOCuota) * (1 + v)));
            iepsImporte = r2(base * ieps.tasaOCuota);
        } else if (ieps?.factor === 'Cuota') {
            iepsImporte = r2(unidades * ieps.tasaOCuota);
            base = r2(total / (1 + v) - iepsImporte);
        } else {
            base = r2(total / (1 + v));
            iepsImporte = 0;
        }
        const baseIva = r2(base + iepsImporte);
        return {
            subtotal: r2(base + descuento),
            descuento,
            base,
            ieps: iepsImporte,
            baseIva,
            iva: r2(total - baseIva),
            total,
            unidadesDeCuota: ieps?.factor === 'Cuota' ? unidades : 0,
        };
    }

    const subtotal = r2(bruto);
    const base = r2(subtotal - descuento);
    const iepsImporte = !ieps ? 0 : ieps.factor === 'Tasa' ? r2(base * ieps.tasaOCuota) : r2(unidades * ieps.tasaOCuota);
    const baseIva = r2(base + iepsImporte);
    const iva = r2(baseIva * v);
    return {
        subtotal,
        descuento,
        base,
        ieps: iepsImporte,
        baseIva,
        iva,
        total: r2(baseIva + iva),
        unidadesDeCuota: ieps?.factor === 'Cuota' ? unidades : 0,
    };
}
