/**
 * @fileoverview C3 de plan-caja-sin-salir · Descuento a todo el ticket.
 * @module Contracts/PosTicket
 *
 * Se aplica como un porcentaje en CADA renglón, combinado con el descuento propio que ya tuviera. Así
 * queda repartido en proporción al importe sin una regla de reparto aparte, y el CFDI y los reportes de
 * margen lo leen por concepto, como cualquier descuento de renglón. Si se captura un importe, se
 * convierte al porcentaje que lo produce. El espejo en C# es `Pittaj.Application.PosTicket.DescuentoAlTicket`.
 *
 * La autorización usa el mismo umbral que el descuento de renglón (`checkout.discount-threshold-percent`).
 */

import { z } from 'zod';

const redondea2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** El descuento de un renglón con el del ticket encima: 10 % y luego 5 % son 14.5 %, no 15 %. */
export function combinarDescuentos(descuentoDelRenglon: number, descuentoDelTicket: number): number {
    const r = 100 * (1 - (1 - descuentoDelRenglon / 100) * (1 - descuentoDelTicket / 100));
    return Math.min(100, Math.max(0, redondea2(r)));
}

/** El porcentaje que produce un importe sobre lo que el ticket vale hoy. Tope 100. */
export function porcentajeParaImporte(importeDelTicket: number, importe: number): number {
    if (importeDelTicket <= 0 || importe <= 0) return 0;
    return Math.min(100, redondea2((importe / importeDelTicket) * 100));
}

/** Lo mínimo de un renglón para la vista previa: su importe ya con su propio descuento. */
export interface RenglonParaDescuento {
    readonly id: string;
    readonly importe: number;
}

export interface VistaPreviaDelDescuento {
    readonly renglones: readonly { readonly id: string; readonly descuento: number }[];
    readonly descuento: number;
    readonly totalDespues: number;
}

/** Cuánto baja cada renglón y el ticket con un porcentaje sobre el ticket. */
export function vistaPreviaDelDescuento(renglones: readonly RenglonParaDescuento[], porcentaje: number): VistaPreviaDelDescuento {
    const lista = renglones.map((r) => ({ id: r.id, descuento: redondea2((r.importe * porcentaje) / 100) }));
    const descuento = redondea2(lista.reduce((s, r) => s + r.descuento, 0));
    const antes = redondea2(renglones.reduce((s, r) => s + r.importe, 0));
    return { renglones: lista, descuento, totalDespues: redondea2(antes - descuento) };
}

/** POST /api/pos-tickets/:id/ticket-discount — aplica el porcentaje a todos los renglones. */
export const applyTicketDiscountSchema = z.object({
    percent: z.number().gt(0).max(100),
    version: z.number().int().min(0),
});
export type ApplyTicketDiscountInput = z.infer<typeof applyTicketDiscountSchema>;
