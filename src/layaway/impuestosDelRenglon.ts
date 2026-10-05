/**
 * @fileoverview D7h1 · El snapshot fiscal del renglón de un apartado.
 * @module Contracts/Layaway
 *
 * Un apartado nace de un ticket y **se liquida como venta**: al entregarse, el apartado produce un
 * ticket COMPLETED con estos mismos renglones, pagado con la aplicación del anticipo. Para que ese
 * ticket (y su CFDI) lleve el impuesto con que se apartó —y no el del catálogo del día de la
 * entrega—, el renglón guarda lo mismo que el renglón del ticket guardaba: tasa, código y factor
 * del impuesto, si el precio lo incluye, IEPS, claves SAT, unidad, clase de retención, impuesto
 * local y objeto de impuesto forzado. Es el principio del snapshot por renglón (ADR-006).
 *
 * Los importes no viajan: se derivan con `importesDelRenglonDeVenta`, la misma cuenta del ticket
 * en la nube y en el escritorio. Un renglón viejo (sin snapshot) vale `cantidad × precio`, que es
 * lo que siempre valió.
 */

import { z } from 'zod';
import { importesDelRenglonDeVenta, type ImportesDelRenglonDeVenta } from '../tax/importesDelRenglonDeVenta.js';

export const impuestosDelRenglonDeApartadoSchema = z.object({
    productCode: z.string().max(50).nullish(),
    productSku: z.string().max(50).nullish(),
    unitName: z.string().max(30).nullish(),
    /** Unidades base por unidad apartada (la cuota del IEPS se cobra por unidad base). */
    unitFactor: z.number().positive().nullish(),
    /** 0–100. */
    discountPercent: z.number().min(0).max(100).nullish(),
    /** Tasa de IVA: fracción (0.16) o porcentaje (16); se normaliza al calcular. */
    taxPercent: z.number().min(0),
    taxCode: z.string().max(10).nullish(),
    taxFactor: z.string().max(10).nullish(),
    /** El precio del renglón ya trae los impuestos (precio de etiqueta). */
    taxIncluded: z.boolean(),
    iepsPercent: z.number().min(0).nullish(),
    iepsFactor: z.enum(['Tasa', 'Cuota']).nullish(),
    satProductCode: z.string().max(20).nullish(),
    satUnitCode: z.string().max(20).nullish(),
    retentionClass: z.string().max(20).nullish(),
    localTaxName: z.string().max(60).nullish(),
    localTaxRate: z.number().min(0).max(1).nullish(),
    objetoImp: z.string().max(2).nullish(),
    businessLineId: z.string().max(36).nullish(),
});

export type ImpuestosDelRenglonDeApartado = z.infer<typeof impuestosDelRenglonDeApartadoSchema>;

/** Tasa como fracción: 16 → 0.16; 0.16 se queda. */
export function tasaComoFraccion(t: number | null | undefined): number {
    const v = t ?? 0;
    return v > 1 ? v / 100 : v;
}

/**
 * Los importes del renglón con su snapshot, o null si es un renglón viejo (sin snapshot). Es la
 * misma cuenta que el renglón del ticket: el ticket de la liquidación suma lo mismo que el apartado.
 */
export function importesDelRenglonDeApartado(r: {
    readonly quantity: number;
    readonly unitPrice: number;
    readonly impuestos?: ImpuestosDelRenglonDeApartado | null;
}): ImportesDelRenglonDeVenta | null {
    const i = r.impuestos;
    if (!i) return null;
    const conIeps = Boolean(i.iepsFactor) && (i.iepsPercent ?? 0) > 0;
    return importesDelRenglonDeVenta({
        cantidad: r.quantity,
        factorDeUnidad: i.unitFactor ?? 1,
        precioUnitario: r.unitPrice,
        descuentoPorcentaje: i.discountPercent ?? 0,
        tasaIva: tasaComoFraccion(i.taxPercent),
        ieps: conIeps ? { factor: i.iepsFactor!, tasaOCuota: i.iepsPercent! } : null,
        tasaLocal: (i.localTaxRate ?? 0) > 0 ? i.localTaxRate! : null,
        impuestosIncluidos: i.taxIncluded,
    });
}

/** Lo que vale el renglón: con snapshot, el total de la venta; sin él, cantidad × precio. */
export function totalDelRenglonDeApartado(r: {
    readonly quantity: number;
    readonly unitPrice: number;
    readonly impuestos?: ImpuestosDelRenglonDeApartado | null;
}): number {
    return importesDelRenglonDeApartado(r)?.total ?? Math.round(r.quantity * r.unitPrice * 100) / 100;
}

/**
 * El tipo del pago con que se liquida un apartado: la **aplicación del anticipo**. No es dinero que
 * entre a la caja (ese entró con cada abono): el corte no lo cuenta, la póliza lo carga a anticipos
 * de clientes (206-01) y el CFDI lo factura con forma de pago `30` cuando los anticipos se
 * facturaron (Anexo 20, apéndice 6).
 */
export const TIPO_DE_PAGO_ANTICIPO = 'ADVANCE' as const;
