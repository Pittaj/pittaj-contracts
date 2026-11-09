/**
 * @fileoverview Las reservas que pone un documento (I7b): el apartado, el pedido y el traspaso.
 * @module Contracts/Inventory/Schemas/ReservasDeDocumento
 *
 * **Espejo exacto en el escritorio** (`Pittaj.Domain.Inventory.ReservasDeDocumento`). Cada punta
 * reserva cuando ella misma mueve el documento —no al recibirlo por sync: la reserva viaja aparte—,
 * y el id de cada reserva es determinista (`idDeReserva`), así que si las dos llegaran a reservar el
 * mismo renglón quedaría una sola fila.
 *
 * ── Qué hace cada estado ──
 *
 * - **Reservar** (`RESERVE`): el documento está vivo y compromete. Se crea una reserva por producto
 *   y bodega, o se ajusta la que ya había. **Nunca se cierra nada aquí**: un renglón que se quitó
 *   deja su reserva en cero. Así no hay que reabrir una cerrada (el sync no reabre: protege a quien
 *   ya vendió esas piezas).
 * - **Surtir** (`FULFILL`): la mercancía salió por el documento. Las activas pasan a `FULFILLED`.
 * - **Liberar** (`RELEASE`): el documento se canceló o dejó de comprometer. Las activas pasan a
 *   `RELEASED`.
 *
 * **Producción** (2.84.0): la orden **liberada** compromete sus insumos en su bodega; terminada,
 * salieron; borrador o cancelada, se sueltan. Un borrador es un plan, no un compromiso.
 */

import type { StockReservationSource, StockReservationStatus } from './stockReservation.schema.js';
import type { StockTransferStatus } from './stockTransfer.schema.js';

export type AccionDeReserva = 'RESERVE' | 'FULFILL' | 'RELEASE';

const r4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** Apartado: abierto compromete; liquidado salió; cancelado o vencido se suelta. */
export function accionDeApartado(status: string): AccionDeReserva {
    if (status === 'OPEN') return 'RESERVE';
    if (status === 'COMPLETED') return 'FULFILL';
    return 'RELEASE';
}

/** Traspaso: el borrador compromete en la origen; enviado salió; cancelado se suelta. */
export function accionDeTraspaso(status: StockTransferStatus): AccionDeReserva {
    if (status === 'DRAFT') return 'RESERVE';
    if (status === 'SENT' || status === 'RECEIVED') return 'FULFILL';
    return 'RELEASE';
}

/**
 * Pedido de cliente: compromete desde que se confirma hasta que sale; borrador y cotización todavía
 * no prometen nada; cancelado o devuelto se suelta.
 */
export function accionDePedido(status: string): AccionDeReserva {
    if (status === 'CONFIRMED' || status === 'PREPARING' || status === 'READY') return 'RESERVE';
    if (status === 'SHIPPED' || status === 'DELIVERED' || status === 'COMPLETED') return 'FULFILL';
    return 'RELEASE';
}

/**
 * (2.84.0) Orden de producción: liberada compromete los insumos (lo que se va a consumir) en su
 * bodega; terminada, salieron; borrador o cancelada se sueltan.
 *
 * Ojo, quien mueva la orden: **de liberada a borrador** no se libera, se reserva con cero renglones
 * (la reserva queda en cero, activa). El id es determinista y una cerrada no se reabre, así que
 * liberarla otra vez no podría revivirla.
 */
export function accionDeProduccion(status: string): AccionDeReserva {
    if (status === 'RELEASED') return 'RESERVE';
    if (status === 'COMPLETED') return 'FULFILL';
    return 'RELEASE';
}

/** La semilla del id de una reserva de documento. **Idéntica en el escritorio**: pasa por el mismo UUID determinista. */
export function semillaDeReserva(sourceType: StockReservationSource, docId: string, productId: string, warehouseId: string): string {
    return `stock:reservation:${sourceType}:${docId}:${productId}:${warehouseId}`;
}

export interface RenglonAReservar {
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    readonly warehouseId: string;
    readonly quantity: number;
}

export interface ReservaExistente {
    readonly id: string;
    readonly productId: string;
    readonly warehouseId: string;
    readonly quantity: number;
    readonly status: StockReservationStatus;
}

export interface PlanDeReservas {
    /** Reservas nuevas (id de `semillaDeReserva`). */
    readonly crear: RenglonAReservar[];
    /** Activas a las que cambia la cantidad (a cero si el renglón se quitó). */
    readonly cambiar: { readonly id: string; readonly quantity: number }[];
    /** Activas que se cierran. */
    readonly cerrar: { readonly id: string; readonly status: 'FULFILLED' | 'RELEASED' }[];
}

/** Junta los renglones por producto y bodega: un mismo producto en dos renglones es una reserva. */
export function agruparRenglones(renglones: readonly RenglonAReservar[]): RenglonAReservar[] {
    const mapa = new Map<string, RenglonAReservar>();
    for (const r of renglones) {
        const k = `${r.productId}|${r.warehouseId}`;
        const previo = mapa.get(k);
        mapa.set(k, previo ? { ...previo, quantity: r4(previo.quantity + r.quantity) } : { ...r, quantity: r4(r.quantity) });
    }
    return [...mapa.values()];
}

/** Qué hacer con las reservas de un documento para que digan lo que dice el documento. */
export function planDeReservas(
    existentes: readonly ReservaExistente[],
    renglones: readonly RenglonAReservar[],
    accion: AccionDeReserva
): PlanDeReservas {
    const activas = existentes.filter((e) => e.status === 'ACTIVE');
    if (accion !== 'RESERVE') {
        const status = accion === 'FULFILL' ? 'FULFILLED' : 'RELEASED';
        return { crear: [], cambiar: [], cerrar: activas.map((e) => ({ id: e.id, status })) };
    }
    const deseadas = agruparRenglones(renglones).filter((r) => r.quantity > 0);
    const clave = (p: string, w: string) => `${p}|${w}`;
    const porClave = new Map(existentes.map((e) => [clave(e.productId, e.warehouseId), e]));
    const quedan = new Set<string>();
    const crear: RenglonAReservar[] = [];
    const cambiar: { id: string; quantity: number }[] = [];
    for (const d of deseadas) {
        const k = clave(d.productId, d.warehouseId);
        quedan.add(k);
        const e = porClave.get(k);
        if (!e) crear.push(d);
        else if (e.status === 'ACTIVE' && e.quantity !== d.quantity) cambiar.push({ id: e.id, quantity: d.quantity });
        // Una cerrada con la misma clave no se reabre: el documento ya la surtió o la soltó.
    }
    for (const e of activas) {
        if (!quedan.has(clave(e.productId, e.warehouseId)) && e.quantity !== 0) cambiar.push({ id: e.id, quantity: 0 });
    }
    return { crear, cambiar, cerrar: [] };
}
