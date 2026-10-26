/**
 * @fileoverview F3.1 · La venta sin caja: la factura de un servicio, una iguala o un cobro que no
 * pasa por el cajón.
 * @module Contracts/DirectSale
 *
 * Hasta aquí lo único que se contabilizaba, entraba a cuentas por cobrar y llevaba CFDI era el
 * **ticket de caja**, y un ticket exige una sesión de caja abierta. Un despacho que factura su
 * iguala mensual, una panadería que le factura el pastel del evento a una empresa o la propia
 * plataforma que cobra sus suscripciones no tienen cajón que abrir. Este documento es su venta.
 *
 * **Qué es y qué no es:**
 *
 * - Nace **a crédito**: se contabiliza al emitirse (Clientes contra Ventas e IVA por cobrar) y
 *   entra a cuentas por cobrar. Lo que se pague después es un cobro, el mismo de siempre. Una
 *   venta de contado sin caja es una venta sin caja más su cobro el mismo día.
 * - **No mueve inventario.** Para vender mercancía está la caja o el pedido, que sí la sacan del
 *   almacén. Por eso un renglón es un concepto (servicio, renta, iguala); si viene de un producto,
 *   es solo para copiar su nombre, sus claves del SAT y su impuesto.
 * - Lleva **IVA** (16 %, 8 % frontera, tasa 0, exento o no objeto), con la misma regla de
 *   redondeo del ticket (`importesDelRenglonDeVenta`).
 * - **D1c · IEPS por renglón** (por tasa o por cuota, con su clase de la ley) y **retenciones del
 *   cliente** (ISR e IVA) por documento. Las retenciones son importes ya decididos —los trae el CFDI
 *   de otro sistema, o los decidirá `retencionesDeLaVenta` cuando Pittaj timbre (D3)—, no se
 *   recalculan aquí. Impuestos locales siguen sin aplicar y se rechazan.
 *
 * **El total es lo que el cliente paga**: base + IVA + IEPS − retenciones, como el `Total` del CFDI.
 * Es lo que entra a cuentas por cobrar; lo retenido lo entera el cliente al SAT a nombre de quien
 * vende, y por eso ya no se le cobra.
 * - Va **en pesos**.
 *
 * Plan: docs `producto/plan-empresas-y-lineas-de-negocio.md`, «F3 en detalle». Gemela del
 * escritorio: `Pittaj.Domain/DirectSale/VentaSinCaja.cs` (mismos vectores).
 */
import { importesDelRenglonDeVenta } from '../tax/importesDelRenglonDeVenta.js';
import { snapshotDelImpuesto, type SnapshotDelImpuesto } from '../tax/impuestoDelRenglon.js';
import type { FactorDeIeps } from '../tax/importesDelRenglonDeVenta.js';

/** D1c · El IEPS de un renglón: por tasa (fracción de la base) o por cuota (pesos por unidad). */
export interface IepsDeRenglonSinCaja {
    readonly factor: FactorDeIeps;
    readonly tasaOCuota: number;
    /** Clase de la ley (art. 2o., fr. I): para declararlo por clase. Null si no se sabe. */
    readonly categoria?: string | null;
}

/** D1c · Lo que el cliente retiene de la venta, ya decidido. */
export interface RetencionesDeVentaSinCaja {
    readonly isr: number;
    readonly iva: number;
}

/** Estados de la venta sin caja. No se edita ni se borra: se cancela. */
export const DIRECT_SALE_STATUSES = ['ISSUED', 'CANCELLED'] as const;
export type DirectSaleStatus = (typeof DIRECT_SALE_STATUSES)[number];

/** Prefijo del folio: `VSC-000001`. Lo asigna la nube, que es donde se emite. */
export const DIRECT_SALE_FOLIO_PREFIX = 'VSC';

/**
 * El impuesto de un renglón, como lo elige quien captura.
 *
 * Son los cuatro casos que el CFDI distingue (D7a): gravado a una tasa (16 % u 8 %), tasa 0,
 * exento y no objeto. Se guardan con el mismo snapshot que el ticket (`taxCode`, `taxFactor`,
 * `taxPercent`) para que el timbrado lea los dos documentos con la misma regla.
 */
export const IMPUESTOS_DE_VENTA_SIN_CAJA = ['IVA', 'ZERO', 'EXEMPT', 'NOT_OBJECT'] as const;
export type ImpuestoDeVentaSinCaja = (typeof IMPUESTOS_DE_VENTA_SIN_CAJA)[number];

/** Tasas de IVA que acepta un renglón gravado: general y región fronteriza (decreto de estímulos). */
export const TASAS_DE_IVA = [0.16, 0.08] as const;

/** Lo que hace falta de un renglón para calcularlo. */
export interface RenglonDeVentaSinCaja {
    readonly cantidad: number;
    readonly precioUnitario: number;
    /** 0–100. */
    readonly descuentoPorcentaje?: number;
    readonly impuesto: ImpuestoDeVentaSinCaja;
    /** Fracción (0.16). Solo cuenta con `impuesto = 'IVA'`. */
    readonly tasaIva?: number;
    /** El precio ya trae el IVA. */
    readonly impuestosIncluidos?: boolean;
    /** D1c · El IEPS del renglón; ausente = no lleva. */
    readonly ieps?: IepsDeRenglonSinCaja | null;
}

/** Los importes de un renglón, ya redondeados como se guardan. */
export interface ImportesDeRenglonSinCaja {
    readonly subtotal: number;
    readonly descuento: number;
    /** Subtotal − descuento: la venta neta del renglón y la base del IEPS. */
    readonly base: number;
    /** D1c · 0 si no lleva. El IVA se calcula sobre base + IEPS (LIVA art. 12). */
    readonly ieps: number;
    readonly iva: number;
    /** Base + IEPS + IVA. Las retenciones son del documento, no del renglón. */
    readonly total: number;
    /** El impuesto como se guarda en el renglón: `taxCode`, `taxFactor` y la tasa en fracción. */
    readonly snapshot: SnapshotDelImpuesto & { readonly taxPercent: number };
}

export interface TotalesDeVentaSinCaja {
    readonly subtotal: number;
    readonly descuento: number;
    /** Σ bases: lo que va a la cuenta de ventas. */
    readonly base: number;
    readonly iva: number;
    /** D1c · Σ IEPS de los renglones. */
    readonly ieps: number;
    /** D1c · Lo que el cliente retiene. */
    readonly isrRetenido: number;
    readonly ivaRetenido: number;
    /** Lo que el cliente paga: base + IVA + IEPS − retenciones. */
    readonly total: number;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** La tasa efectiva del renglón: solo `IVA` cobra impuesto. */
export function tasaDelRenglon(r: Pick<RenglonDeVentaSinCaja, 'impuesto' | 'tasaIva'>): number {
    return r.impuesto === 'IVA' ? (r.tasaIva ?? 0.16) : 0;
}

/** El renglón calculado. Misma aritmética que el renglón del ticket. */
export function importesDeRenglonSinCaja(r: RenglonDeVentaSinCaja): ImportesDeRenglonSinCaja {
    const tasa = tasaDelRenglon(r);
    const i = importesDelRenglonDeVenta({
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        descuentoPorcentaje: r.descuentoPorcentaje ?? 0,
        tasaIva: tasa,
        ieps: r.ieps ? { factor: r.ieps.factor, tasaOCuota: r.ieps.tasaOCuota } : null,
        impuestosIncluidos: r.impuestosIncluidos ?? false,
    });
    return {
        subtotal: i.subtotal,
        descuento: i.descuento,
        base: i.base,
        ieps: i.ieps,
        iva: i.iva,
        total: i.total,
        snapshot: { ...snapshotDelImpuesto(r.impuesto), taxPercent: tasa },
    };
}

/** Los totales del documento: la suma de sus renglones ya redondeados, nunca un recálculo global. */
export function totalesDeVentaSinCaja(
    renglones: readonly RenglonDeVentaSinCaja[],
    retenciones: RetencionesDeVentaSinCaja = { isr: 0, iva: 0 },
): TotalesDeVentaSinCaja {
    let subtotal = 0;
    let descuento = 0;
    let base = 0;
    let iva = 0;
    let ieps = 0;
    let bruto = 0;
    for (const r of renglones) {
        const i = importesDeRenglonSinCaja(r);
        subtotal += i.subtotal;
        descuento += i.descuento;
        base += i.base;
        iva += i.iva;
        ieps += i.ieps;
        bruto += i.total;
    }
    const isrRetenido = r2(retenciones.isr);
    const ivaRetenido = r2(retenciones.iva);
    return {
        subtotal: r2(subtotal),
        descuento: r2(descuento),
        base: r2(base),
        iva: r2(iva),
        ieps: r2(ieps),
        isrRetenido,
        ivaRetenido,
        total: r2(r2(bruto) - isrRetenido - ivaRetenido),
    };
}

/**
 * D1c · Por qué unas retenciones no caben en la venta, o `null` si caben. El ISR se retiene sobre
 * la base y el IVA sobre el IVA trasladado: retener más que eso no tiene lectura.
 */
export function retencionesQueNoCaben(
    totales: Pick<TotalesDeVentaSinCaja, 'base' | 'iva'>,
    retenciones: RetencionesDeVentaSinCaja,
): string | null {
    if (retenciones.isr < 0 || retenciones.iva < 0) return 'Una retención no puede ser negativa';
    if (r2(retenciones.isr) - totales.base > 0.005) {
        return `El ISR retenido (${retenciones.isr.toFixed(2)}) pasa de la base de la venta (${totales.base.toFixed(2)})`;
    }
    if (r2(retenciones.iva) - totales.iva > 0.005) {
        return `El IVA retenido (${retenciones.iva.toFixed(2)}) pasa del IVA de la venta (${totales.iva.toFixed(2)})`;
    }
    return null;
}

/** El impuesto guardado de un renglón, de vuelta a la opción que lo produjo. */
export function impuestoDeSnapshot(taxCode: string | null, taxFactor: string | null, taxPercent: number): ImpuestoDeVentaSinCaja {
    if (!taxCode) return 'NOT_OBJECT';
    if (taxFactor === 'Exento') return 'EXEMPT';
    return taxPercent > 0 ? 'IVA' : 'ZERO';
}

export const NOMBRE_DEL_IMPUESTO: Record<ImpuestoDeVentaSinCaja, string> = {
    IVA: 'IVA',
    ZERO: 'Tasa 0 %',
    EXEMPT: 'Exento',
    NOT_OBJECT: 'No objeto de impuesto',
};
