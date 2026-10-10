/**
 * @fileoverview Del CFDI recibido a la compra: los renglones y el total, **al centavo del
 * comprobante**. Desvío D1 del plan «Comprobantes que cuadran» (docs, 2026-10-04).
 * @module Contracts/Purchase
 *
 * **Espejo exacto del escritorio** (`Pittaj.Domain/Purchasing/ComprobanteRecibido.cs`), con los
 * mismos vectores de prueba. La web lo usa para la vista previa, la nube y el escritorio para
 * crear la compra: los tres tienen que dar el mismo total, y ese total es el del CFDI.
 *
 * ## Las reglas (y de dónde salen)
 *
 * 1. **El renglón copia los importes del concepto; no los recalcula.** Recalcular desde cantidad
 *    × costo a cuatro decimales y un descuento en porcentaje a dos perdía centavos sin avisar.
 *    El renglón guarda subtotal, descuento, IVA y total tal cual; cantidad, costo, descuento % y
 *    tasa quedan para leerlos y para recalcular si alguien los edita.
 * 2. **El IEPS trasladado del concepto es costo**, salvo que la empresa lo acredite (D8). Quien no
 *    enajena esos mismos bienes no puede acreditarlo (LIEPS art. 4), así que para él forma parte
 *    de lo que costó la mercancía o el servicio. Telmex: importe 328.44 + IEPS 6.90 = costo 335.34.
 *    El acreditable sale del costo pero **no del total**: se le debe al proveedor igual. Va en el
 *    documento (`iepsAcreditable`), por clase, y la póliza lo lleva a «IEPS acreditable».
 * 3. **El IVA del renglón es el que dice el concepto.** Su base no siempre es el importe: incluye
 *    el IEPS (LIVA art. 12 y art. 18) y la gasolina lleva la cuota de IEPS escondida en el precio.
 *    La tasa del renglón es la nominal si la reproduce; si no, la efectiva a seis decimales.
 * 4. **El documento suma lo que el renglón no tiene**: resta las retenciones de IVA e ISR, y suma
 *    los impuestos locales trasladados y resta los retenidos (complemento `implocal`). Es la
 *    identidad que el SAT valida en el `Total`.
 * 5. **Otra moneda se convierte a pesos con el `TipoCambio` del comprobante** (CFF art. 20).
 * 6. **El total de la compra tiene que ser el `Total` del CFDI.** Lo único que se absorbe es el
 *    redondeo —un par de centavos por renglón, entre la suma de los conceptos y lo que la
 *    cabecera dice—, y va al renglón mayor. Lo que pase de ahí no se convierte: `cuadre` dice
 *    cuánto falta.
 */

import { roundHalfEven } from './purchaseMath.js';
import type { CfdiConceptoInput } from './cfdiMatching.js';

// ─────────────────────────────────────────────────────────────────────────────
//  El renglón
// ─────────────────────────────────────────────────────────────────────────────

/** Los importes de un renglón, como se guardan. Iguales a `PurchaseLineAmounts`. */
export interface ImportesDelRenglon {
    readonly subtotalAmount: number;
    readonly discountAmount: number;
    /** Base del renglón: subtotal − descuento. */
    readonly taxBaseAmount: number;
    /** IVA del renglón. */
    readonly taxAmount: number;
    readonly totalAmount: number;
}

/** Un concepto del CFDI ya hecho renglón de compra. */
export interface RenglonDelCfdi {
    readonly quantity: number;
    /** Costo unitario a cuatro decimales (la escala de la columna). Para leer; manda `importes`. */
    readonly unitCost: number;
    /** Descuento en porcentaje a cuatro decimales. Para leer; manda `importes`. */
    readonly discountPercent: number;
    /** Tasa de IVA del renglón (fracción, seis decimales). */
    readonly taxPercent: number;
    readonly importes: ImportesDelRenglon;
    /** IEPS del concepto que quedó dentro del costo (0 si se acredita o no hay). */
    readonly iepsAlCosto: number;
    /** D8 · IEPS del concepto que se acredita (0 si es costo o no hay). Va en el documento. */
    readonly iepsAcreditable: number;
    /** D8 · La clase (inciso) del IEPS acreditable, o null. */
    readonly iepsCategoria: string | null;
}

export interface OpcionesDelComprobante {
    /**
     * La empresa acredita el IEPS de lo que compra (D8: contribuyente de IEPS que enajena los
     * mismos bienes). Por omisión, no: el IEPS es costo.
     */
    readonly iepsAcreditable?: boolean;
    /**
     * D8 · La decisión por concepto: si su IEPS se acredita y de qué clase es. Manda sobre
     * `iepsAcreditable`. La arma quien convierte con `categoriaDelIepsRecibido` (catálogo) e
     * `iepsEsAcreditable` (lo que causa la empresa).
     */
    readonly iepsDelConcepto?: (c: CfdiConceptoInput) => { readonly acreditable: boolean; readonly categoria: string | null };
}

const r2 = (n: number): number => roundHalfEven(n, 2);
const r4 = (n: number): number => roundHalfEven(n, 4);
const r6 = (n: number): number => roundHalfEven(n, 6);

/**
 * La tasa con la que el renglón reproduce su IVA: la nominal del CFDI si sobre la base da el IVA
 * del concepto, y si no la efectiva (IVA ÷ base) a seis decimales.
 */
export function tasaQueReproduce(base: number, iva: number, tasaNominal: number): number {
    if (!(base > 0)) return tasaNominal;
    if (r2(base * tasaNominal) === r2(iva)) return tasaNominal;
    return r6(iva / base);
}

/** Un concepto del CFDI hecho renglón, en la moneda del comprobante. */
export function renglonDelCfdi(c: CfdiConceptoInput, opciones: OpcionesDelComprobante = {}): RenglonDelCfdi {
    const ieps = r2(c.iepsAmount ?? 0);
    const decision = ieps > 0 && opciones.iepsDelConcepto
        ? opciones.iepsDelConcepto(c)
        : { acreditable: Boolean(opciones.iepsAcreditable), categoria: null };
    const iepsAlCosto = decision.acreditable ? 0 : ieps;
    const descuento = r2(c.descuento ?? 0);
    const subtotalAmount = r2((c.importe ?? 0) + iepsAlCosto);
    const taxBaseAmount = r2(subtotalAmount - descuento);
    // Sin el importe del IVA (una punta vieja), la tasa nominal sobre la base legal del IVA, que
    // incluye el IEPS se acredite o no.
    const baseDelIva = r2((c.importe ?? 0) - descuento + ieps);
    const taxAmount =
        c.taxAmount !== null && c.taxAmount !== undefined ? r2(c.taxAmount) : r2(baseDelIva * c.taxRate);
    const quantity = c.cantidad > 0 ? c.cantidad : 1;
    return {
        quantity,
        unitCost: r4(subtotalAmount / quantity),
        discountPercent: subtotalAmount > 0 ? r4((descuento / subtotalAmount) * 100) : 0,
        taxPercent: tasaQueReproduce(taxBaseAmount, taxAmount, c.taxRate),
        importes: {
            subtotalAmount,
            discountAmount: descuento,
            taxBaseAmount,
            taxAmount,
            totalAmount: r2(taxBaseAmount + taxAmount),
        },
        iepsAlCosto,
        iepsAcreditable: r2(ieps - iepsAlCosto),
        iepsCategoria: decision.acreditable && ieps > 0 ? decision.categoria : null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
//  El documento
// ─────────────────────────────────────────────────────────────────────────────

/** Lo que el documento trae fuera de los renglones. Siempre ≥ 0; el signo lo pone la fórmula. */
export interface ImpuestosDelDocumento {
    readonly retencionIsr: number;
    readonly retencionIva: number;
    /** Impuestos locales trasladados (`implocal:TrasladosLocales`): costo. */
    readonly trasladoLocal: number;
    /** Impuestos locales retenidos (`implocal:RetencionesLocales`). */
    readonly retencionLocal: number;
    /**
     * D8 · IEPS acreditable de los renglones: fuera del costo, dentro de lo que se le debe al
     * proveedor. Ausente = 0.
     */
    readonly iepsAcreditable?: number;
}

export const SIN_IMPUESTOS_DEL_DOCUMENTO: ImpuestosDelDocumento = {
    retencionIsr: 0,
    retencionIva: 0,
    trasladoLocal: 0,
    retencionLocal: 0,
};

/**
 * El total de la compra: lo de los renglones, menos lo retenido, más los locales trasladados.
 * Es lo que se le debe al proveedor y lo que Cuentas por pagar, Bancos y la póliza ven.
 */
export function totalNetoDeLaCompra(totalDeRenglones: number, d: Partial<ImpuestosDelDocumento> = {}): number {
    return r2(
        totalDeRenglones -
            (d.retencionIsr ?? 0) -
            (d.retencionIva ?? 0) +
            (d.trasladoLocal ?? 0) -
            (d.retencionLocal ?? 0) +
            (d.iepsAcreditable ?? 0)
    );
}

/** La cabecera del CFDI recibido, como la guarda el buzón (en la moneda del comprobante). */
export interface CabeceraDelComprobante extends ImpuestosDelDocumento {
    readonly total: number;
    /** IVA trasladado total de la cabecera. */
    readonly trasladoIva: number;
    /** `Moneda` del CFDI. Nulo, `MXN` o `XXX` = pesos. */
    readonly moneda?: string | null;
    /** `TipoCambio` del CFDI. Obligatorio si la moneda no es pesos. */
    readonly tipoCambio?: number | null;
}

/** Pasado esto por renglón, la diferencia ya no es redondeo. */
export const REDONDEO_POR_RENGLON = 0.02;
/** Tolerancia del candado: el total de la compra contra el del CFDI. */
export const TOLERANCIA_DEL_CUADRE = 0.01;

export interface CompraDelComprobante {
    /** Alineados con los conceptos de entrada, en pesos. */
    readonly renglones: RenglonDelCfdi[];
    /** En pesos. */
    readonly impuestosDelDocumento: ImpuestosDelDocumento;
    /** Total de la compra que resulta, en pesos. */
    readonly total: number;
    /** El `Total` del CFDI, en pesos. */
    readonly totalDelComprobante: number;
    /** Lo que se registra de la moneda original (6.6), o null si es en pesos. */
    readonly monedaOriginal: { readonly foreignCurrency: string; readonly foreignTotal: number } | null;
    readonly cuadre: CuadreConElComprobante;
    /** D8 · El IEPS acreditable por clase (inciso), en pesos. Vacío si no hay. */
    readonly iepsAcreditablePorCategoria: Readonly<Record<string, number>>;
}

export interface CuadreConElComprobante {
    readonly cuadra: boolean;
    /** Total de la compra − total del CFDI (en pesos). Positivo = la compra suma de más. */
    readonly diferencia: number;
    /** Por qué no cuadra, en palabras, o null si cuadra. */
    readonly motivo: string | null;
}

export function esMonedaNacional(moneda: string | null | undefined): boolean {
    const m = (moneda ?? '').trim().toUpperCase();
    return m === '' || m === 'MXN' || m === 'XXX';
}

function enPesos(c: CfdiConceptoInput, tc: number): CfdiConceptoInput {
    if (tc === 1) return c;
    const p = (n: number | null | undefined) => (n === null || n === undefined ? n : r2(n * tc));
    return {
        ...c,
        valorUnitario: r6(c.valorUnitario * tc),
        importe: r2(c.importe * tc),
        descuento: r2((c.descuento ?? 0) * tc),
        taxAmount: p(c.taxAmount),
        iepsAmount: p(c.iepsAmount),
    };
}

function conImportes(r: RenglonDelCfdi, subtotalAmount: number, taxAmount: number): RenglonDelCfdi {
    const taxBaseAmount = r2(subtotalAmount - r.importes.discountAmount);
    return {
        ...r,
        unitCost: r4(subtotalAmount / r.quantity),
        discountPercent: subtotalAmount > 0 ? r4((r.importes.discountAmount / subtotalAmount) * 100) : 0,
        taxPercent: tasaQueReproduce(taxBaseAmount, taxAmount, r.taxPercent),
        importes: {
            subtotalAmount,
            discountAmount: r.importes.discountAmount,
            taxBaseAmount,
            taxAmount,
            totalAmount: r2(taxBaseAmount + taxAmount),
        },
    };
}

function indiceDelMayor(renglones: RenglonDelCfdi[], pick: (r: RenglonDelCfdi) => number): number {
    let i = -1;
    let mayor = -Infinity;
    renglones.forEach((r, k) => {
        if (pick(r) > mayor) {
            mayor = pick(r);
            i = k;
        }
    });
    return i;
}

/**
 * Los renglones y el total de la compra que sale de un CFDI recibido, con el candado.
 *
 * `conceptos` van en la moneda del comprobante, como los lee el XML; todo lo que devuelve va en
 * pesos.
 */
export function compraDelComprobante(
    conceptos: readonly CfdiConceptoInput[],
    cabecera: CabeceraDelComprobante,
    opciones: OpcionesDelComprobante = {}
): CompraDelComprobante {
    const nacional = esMonedaNacional(cabecera.moneda);
    const tc = nacional ? 1 : (cabecera.tipoCambio ?? 0);
    const monedaOriginal = nacional
        ? null
        : { foreignCurrency: (cabecera.moneda ?? '').trim().toUpperCase(), foreignTotal: r2(cabecera.total) };

    if (!(tc > 0)) {
        return {
            renglones: [],
            impuestosDelDocumento: SIN_IMPUESTOS_DEL_DOCUMENTO,
            total: 0,
            totalDelComprobante: 0,
            monedaOriginal,
            iepsAcreditablePorCategoria: {},
            cuadre: {
                cuadra: false,
                diferencia: 0,
                motivo: `El CFDI viene en ${monedaOriginal?.foreignCurrency} y no trae tipo de cambio.`,
            },
        };
    }

    const totalDelComprobante = r2(cabecera.total * tc);
    const ivaDeLaCabecera = r2(cabecera.trasladoIva * tc);

    let renglones = conceptos.map((c) => renglonDelCfdi(enPesos(c, tc), opciones));
    // D8: el IEPS acreditable va al documento, por clase.
    const iepsAcreditablePorCategoria: Record<string, number> = {};
    for (const r of renglones) {
        if (r.iepsAcreditable > 0) {
            const k = r.iepsCategoria ?? '?';
            iepsAcreditablePorCategoria[k] = r2((iepsAcreditablePorCategoria[k] ?? 0) + r.iepsAcreditable);
        }
    }
    const iepsAcreditable = r2(renglones.reduce((a, r) => a + r.iepsAcreditable, 0));
    const impuestosDelDocumento: ImpuestosDelDocumento = {
        retencionIsr: r2(cabecera.retencionIsr * tc),
        retencionIva: r2(cabecera.retencionIva * tc),
        trasladoLocal: r2(cabecera.trasladoLocal * tc),
        retencionLocal: r2(cabecera.retencionLocal * tc),
        ...(iepsAcreditable > 0 ? { iepsAcreditable } : {}),
    };
    const tolerancia = r2(REDONDEO_POR_RENGLON * Math.max(1, renglones.length));

    // El redondeo entre lo que suman los conceptos y lo que dice la cabecera va al renglón mayor:
    // primero el IVA, luego la base. Más que eso no es redondeo y se deja ver.
    if (renglones.length > 0) {
        const sumaIva = r2(renglones.reduce((a, r) => a + r.importes.taxAmount, 0));
        const dIva = r2(ivaDeLaCabecera - sumaIva);
        if (dIva !== 0 && Math.abs(dIva) <= tolerancia) {
            const i = indiceDelMayor(renglones, (r) => r.importes.taxAmount);
            const r = renglones[i]!;
            renglones = renglones.map((x, k) =>
                k === i ? conImportes(r, r.importes.subtotalAmount, r2(r.importes.taxAmount + dIva)) : x
            );
        }
        const total = totalNetoDeLaCompra(
            r2(renglones.reduce((a, r) => a + r.importes.totalAmount, 0)),
            impuestosDelDocumento
        );
        const dBase = r2(totalDelComprobante - total);
        if (dBase !== 0 && Math.abs(dBase) <= tolerancia) {
            const i = indiceDelMayor(renglones, (r) => r.importes.subtotalAmount);
            const r = renglones[i]!;
            renglones = renglones.map((x, k) =>
                k === i ? conImportes(r, r2(r.importes.subtotalAmount + dBase), r.importes.taxAmount) : x
            );
        }
    }

    const total = totalNetoDeLaCompra(
        r2(renglones.reduce((a, r) => a + r.importes.totalAmount, 0)),
        impuestosDelDocumento
    );
    return {
        renglones,
        impuestosDelDocumento,
        total,
        totalDelComprobante,
        monedaOriginal,
        cuadre: cuadreConElComprobante(total, totalDelComprobante),
        iepsAcreditablePorCategoria,
    };
}

/** El candado: el total de la compra contra el `Total` del CFDI. */
export function cuadreConElComprobante(totalDeLaCompra: number, totalDelComprobante: number): CuadreConElComprobante {
    const diferencia = r2(totalDeLaCompra - totalDelComprobante);
    if (Math.abs(diferencia) <= TOLERANCIA_DEL_CUADRE) return { cuadra: true, diferencia, motivo: null };
    const fmt = (n: number) => Math.abs(n).toFixed(2);
    return {
        cuadra: false,
        diferencia,
        motivo:
            `La compra suma ${totalDeLaCompra.toFixed(2)} y el CFDI dice ${totalDelComprobante.toFixed(2)}: ` +
            `${diferencia > 0 ? 'sobran' : 'faltan'} ${fmt(diferencia)}. ` +
            'Pittaj no sabe leer algún impuesto de este comprobante; no se convierte para no registrar un total que no es.',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Conciliar contra compras ya capturadas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lo que suman los renglones del comprobante: su `Total` antes de retenciones y de impuestos
 * locales. Es la cifra que se compara contra los renglones de una compra capturada a mano, que
 * no sabe de retenciones: un flete de 1,160 con 40 de retención tiene `Total` 1,120, y la compra
 * de 1,160 cuadra con él.
 */
export function totalDeRenglonesDelComprobante(c: Pick<CabeceraDelComprobante, 'total'> & Partial<ImpuestosDelDocumento>): number {
    return r2(c.total + (c.retencionIsr ?? 0) + (c.retencionIva ?? 0) - (c.trasladoLocal ?? 0) + (c.retencionLocal ?? 0));
}

/**
 * Reparte los impuestos del documento entre las compras que ampara un mismo CFDI (ocho
 * remisiones, una factura), en proporción a `pesos` (lo que cada una aporta). El residuo del
 * redondeo va a la de mayor peso. Sin esto, cada compra restaba la retención completa.
 */
export function repartirImpuestosDelDocumento(
    d: ImpuestosDelDocumento,
    pesos: readonly number[]
): ImpuestosDelDocumento[] {
    if (pesos.length === 0) return [];
    const suma = pesos.reduce((a, p) => a + Math.max(0, p), 0);
    const mayor = indiceDelMayorNumero(pesos);
    const partir = (monto: number): number[] => {
        if (pesos.length === 1) return [r2(monto)];
        const partes = pesos.map((p) => (suma > 0 ? r2((monto * Math.max(0, p)) / suma) : 0));
        if (suma <= 0) partes[mayor] = r2(monto);
        const residuo = r2(monto - partes.reduce((a, x) => a + x, 0));
        partes[mayor] = r2(partes[mayor]! + residuo);
        return partes;
    };
    const isr = partir(d.retencionIsr);
    const iva = partir(d.retencionIva);
    const tl = partir(d.trasladoLocal);
    const rl = partir(d.retencionLocal);
    return pesos.map((_, k) => ({ retencionIsr: isr[k]!, retencionIva: iva[k]!, trasladoLocal: tl[k]!, retencionLocal: rl[k]! }));
}

function indiceDelMayorNumero(xs: readonly number[]): number {
    let i = 0;
    xs.forEach((x, k) => {
        if (x > xs[i]!) i = k;
    });
    return i;
}
