/**
 * @fileoverview Reservas (I7): qué compromete una reserva y cuánto queda disponible.
 * @module Contracts/Inventory/Schemas/ReglasDeReserva
 *
 * **Espejo exacto en el escritorio** (`Pittaj.Domain.Inventory.ReglasDeReserva`), con los mismos
 * vectores. Un apartado hecho en una punta sin red tiene que restar disponible en la otra cuando
 * llegue, y las dos tienen que restar lo mismo.
 *
 * ── Lo reservado no se guarda ──
 *
 * Mandato de paridad §4: `reserved` de la existencia se **deriva** de las reservas vigentes, no se
 * suma ni se resta a mano. Una reserva vigente es la `ACTIVE` que no ha vencido; compromete lo que
 * le falta por salir (`quantity − fulfilledQuantity`, nunca negativo). Una manual vencida deja de
 * comprometer en el acto, aunque nadie la haya liberado: el vencimiento es una fecha, no un evento.
 *
 * ── Disponible ──
 *
 * `existencia − reservado`. Puede ser negativo: si se reservó más de lo que hay, decirlo es mejor
 * que esconderlo en un cero. Una bodega que no cuenta para disponible (`countsInAvailable: false`,
 * típico de cuarentena o de producción) tiene disponible cero, sea lo que sea que tenga.
 */

import type { StockReservationStatus } from './stockReservation.schema.js';

const r4 = (n: number) => Math.round(n * 10_000) / 10_000;

export interface ReservaParaCalculo {
    readonly status: StockReservationStatus;
    readonly quantity: number;
    readonly fulfilledQuantity: number;
    /** ISO o Date; nulo = no vence (las de documentos). */
    readonly expiresAt: string | Date | null;
}

const instante = (v: string | Date) => (v instanceof Date ? v.getTime() : Date.parse(v));

/** Activa y sin vencer. */
export function reservaVigente(r: ReservaParaCalculo, ahora: Date): boolean {
    return r.status === 'ACTIVE' && (r.expiresAt === null || instante(r.expiresAt) > ahora.getTime());
}

/** Lo que una reserva compromete todavía: lo que le falta por salir. */
export function pendienteDeReserva(r: Pick<ReservaParaCalculo, 'quantity' | 'fulfilledQuantity'>): number {
    return Math.max(r4(r.quantity - r.fulfilledQuantity), 0);
}

/** Lo reservado de un producto en una bodega: la suma de lo pendiente de sus reservas vigentes. */
export function reservadoDe(reservas: readonly ReservaParaCalculo[], ahora: Date): number {
    return r4(reservas.filter((r) => reservaVigente(r, ahora)).reduce((s, r) => s + pendienteDeReserva(r), 0));
}

/** Existencia menos reservado; cero en una bodega que no cuenta para disponible. */
export function disponibleDe(existencia: number, reservado: number, cuentaParaDisponible = true): number {
    return cuentaParaDisponible ? r4(existencia - reservado) : 0;
}

/** El estado que se enseña: una activa vencida se lee «Vencida». */
export type EstadoVisibleDeReserva = StockReservationStatus | 'EXPIRED';

export function estadoVisibleDeReserva(r: ReservaParaCalculo, ahora: Date): EstadoVisibleDeReserva {
    return r.status === 'ACTIVE' && !reservaVigente(r, ahora) ? 'EXPIRED' : r.status;
}

export const ESTADO_VISIBLE_DE_RESERVA_LABELS: Readonly<Record<EstadoVisibleDeReserva, string>> = {
    ACTIVE: 'Vigente',
    EXPIRED: 'Vencida',
    FULFILLED: 'Surtida',
    RELEASED: 'Liberada',
};

/**
 * Por qué no se puede apartar a mano; `null` si se puede. Una manual pide vencimiento futuro y no
 * puede comprometer más de lo disponible: prometer lo que no hay es justo lo que la reserva evita.
 */
export function bloqueoDeReservaManual(
    pedido: { readonly quantity: number; readonly expiresAt: string | Date },
    disponible: number,
    ahora: Date
): string | null {
    if (!(pedido.quantity > 0)) return 'La cantidad tiene que ser mayor que cero.';
    if (instante(pedido.expiresAt) <= ahora.getTime()) return 'El vencimiento tiene que ser en el futuro.';
    if (pedido.quantity > disponible) {
        return `Solo hay ${Math.max(disponible, 0)} disponibles en esa bodega: no se puede apartar ${pedido.quantity}.`;
    }
    return null;
}
