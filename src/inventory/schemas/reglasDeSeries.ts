/**
 * @fileoverview Números de serie (I8c): identidad, validación y el estado de cada pieza.
 * @module Contracts/Inventory/Schemas/ReglasDeSeries
 *
 * **Espejo exacto en C#**: `Pittaj.Domain/Inventory/ReglasDeSeries.cs`, con los mismos vectores
 * (`reglasDeSeries.test.ts` ↔ `ReglasDeSeriesTests`).
 *
 * - **No hay catálogo de series:** la serie viaja en el movimiento (`serialNumbers`), y dónde está,
 *   si se vendió y cuándo se derivan de los movimientos que la nombran (§4 del mandato).
 * - Un movimiento puede nombrar menos series que su cantidad: lo demás son piezas sin serie
 *   capturada. Nunca más.
 * - Una salida interna (traspaso, ajuste) sin series elegidas toma las que llevan más tiempo en
 *   la bodega; lo que espeja a otro movimiento (la entrada del traspaso, la devolución, la
 *   reversa de una recepción) sigue las series del original que sigan ahí.
 */

import type { SerialNumberStatus } from './stockLot.schema.js';

/** La serie como se compara: sin espacios a los lados y en mayúsculas. */
export function normalizarSerie(serie: string): string {
    return serie.trim().toUpperCase();
}

/** Separa lo capturado (un renglón por pieza, o comas, o espacios) en series normalizadas, sin vacíos. */
export function partirSeries(texto: string): string[] {
    return texto
        .split(/[\s,;]+/)
        .map(normalizarSerie)
        .filter((s) => s.length > 0);
}

/** Series repetidas, más series que piezas o una vacía. El problema en una frase, o nulo. */
export function validarSeries(cantidad: number, series: readonly string[]): string | null {
    const vistas = new Set<string>();
    for (const s of series) {
        const n = normalizarSerie(s);
        if (!n) return 'Hay una serie vacía.';
        if (n.length > 80) return `La serie ${n.slice(0, 20)}… es demasiado larga.`;
        if (vistas.has(n)) return `La serie ${n} está dos veces.`;
        vistas.add(n);
    }
    const piezas = Math.abs(cantidad);
    return series.length > piezas ? `Son ${series.length} series y el renglón mueve ${piezas}.` : null;
}

/** Un movimiento que nombra una serie, como lo necesita la regla del estado. */
export interface MovimientoDeSerie {
    readonly serialNumber: string;
    readonly movementId: string;
    readonly warehouseId: string;
    /** `TRANSIT` para la bodega de tránsito (I4c). */
    readonly warehouseType: string | null;
    readonly direction: 'IN' | 'OUT';
    readonly sourceType: string;
    readonly sourceDocId: string | null;
    /** ISO. */
    readonly occurredAt: string;
}

export interface EstadoDeSerie {
    readonly serialNumber: string;
    readonly status: SerialNumberStatus;
    /** Dónde está, si está en una bodega (o en tránsito). */
    readonly warehouseId: string | null;
    /** Cuándo entró por primera vez, y con qué documento. */
    readonly receivedAt: string;
    readonly receivedDocId: string | null;
    /** Desde cuándo está en la bodega donde está (ordena qué sale primero). */
    readonly inWarehouseSince: string | null;
    readonly soldAt: string | null;
    readonly soldDocId: string | null;
    readonly lastMovementAt: string;
}

/**
 * El estado de una serie a partir de los movimientos que la nombran (en cualquier orden): lo dice
 * el último. Entrar a una bodega = en existencia (o en tránsito, si es la de tránsito); salir por
 * venta = vendida; por devolución al proveedor = devuelta; por traspaso = en tránsito; por lo
 * demás (merma, robo, ajuste) = dada de baja. Nulo si no hay movimientos.
 */
export function estadoDeSerie(movimientos: readonly MovimientoDeSerie[]): EstadoDeSerie | null {
    if (movimientos.length === 0) return null;
    const orden = [...movimientos].sort((a, b) =>
        a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : a.movementId < b.movementId ? -1 : a.movementId > b.movementId ? 1 : 0
    );
    const ultimo = orden[orden.length - 1]!;
    const primera = orden.find((m) => m.direction === 'IN') ?? orden[0]!;
    let status: SerialNumberStatus;
    if (ultimo.direction === 'IN') status = ultimo.warehouseType === 'TRANSIT' ? 'IN_TRANSIT' : 'IN_STOCK';
    else if (ultimo.sourceType === 'SALE') status = 'SOLD';
    else if (ultimo.sourceType === 'PURCHASE_RETURN') status = 'RETURNED_TO_SUPPLIER';
    else if (ultimo.sourceType === 'TRANSFER') status = 'IN_TRANSIT';
    else status = 'WRITTEN_OFF';
    return {
        serialNumber: ultimo.serialNumber,
        status,
        warehouseId: ultimo.direction === 'IN' ? ultimo.warehouseId : null,
        receivedAt: primera.occurredAt,
        receivedDocId: primera.sourceDocId,
        inWarehouseSince: ultimo.direction === 'IN' ? ultimo.occurredAt : null,
        soldAt: status === 'SOLD' ? ultimo.occurredAt : null,
        soldDocId: status === 'SOLD' ? ultimo.sourceDocId : null,
        lastMovementAt: ultimo.occurredAt,
    };
}

/** Los estados de todas las series de una lista de movimientos (de un producto). */
export function estadosDeSeries(movimientos: readonly MovimientoDeSerie[]): EstadoDeSerie[] {
    const por = new Map<string, MovimientoDeSerie[]>();
    for (const m of movimientos) {
        const k = normalizarSerie(m.serialNumber);
        const l = por.get(k);
        if (l) l.push(m);
        else por.set(k, [m]);
    }
    return [...por.values()].map((l) => estadoDeSerie(l)!).sort((a, b) => (a.serialNumber < b.serialNumber ? -1 : a.serialNumber > b.serialNumber ? 1 : 0));
}

/** Las series en existencia en una bodega, de la que lleva más tiempo ahí a la más reciente. */
export function seriesEnBodega(estados: readonly EstadoDeSerie[], warehouseId: string): string[] {
    return estados
        .filter((e) => e.status === 'IN_STOCK' && e.warehouseId === warehouseId)
        .sort((a, b) => {
            const x = a.inWarehouseSince ?? '';
            const y = b.inWarehouseSince ?? '';
            return x < y ? -1 : x > y ? 1 : a.serialNumber < b.serialNumber ? -1 : a.serialNumber > b.serialNumber ? 1 : 0;
        })
        .map((e) => e.serialNumber);
}

/**
 * Las series de una salida o de lo que sigue a otro movimiento: las de `origen` (en su orden) que
 * estén en `disponibles`, hasta `cantidad` piezas. Sin origen, las primeras disponibles.
 */
export function tomarSeries(cantidad: number, disponibles: readonly string[], origen?: readonly string[]): string[] {
    const n = Math.max(0, Math.floor(Math.abs(cantidad) + 1e-9));
    const hay = new Set(disponibles.map(normalizarSerie));
    const fuente = origen ? origen.map(normalizarSerie).filter((s) => hay.has(s)) : disponibles.map(normalizarSerie);
    return [...new Set(fuente)].slice(0, n);
}

/** Hasta cuándo tiene garantía una pieza vendida (`YYYY-MM-DD`), o nulo sin venta o sin meses. */
export function garantiaHasta(soldAt: string | null, warrantyMonths: number | null | undefined): string | null {
    if (!soldAt || !warrantyMonths || warrantyMonths <= 0) return null;
    const [a, m, d] = soldAt.slice(0, 10).split('-').map(Number) as [number, number, number];
    const total = a * 12 + (m - 1) + warrantyMonths;
    const anio = Math.floor(total / 12);
    const mes = (total % 12) + 1;
    const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    return `${anio}-${String(mes).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`;
}
