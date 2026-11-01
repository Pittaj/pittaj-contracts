/** I8c · Números de serie. Los mismos vectores que `ReglasDeSeriesTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import {
    estadoDeSerie,
    estadosDeSeries,
    garantiaHasta,
    partirSeries,
    seriesEnBodega,
    tomarSeries,
    validarSeries,
    type MovimientoDeSerie,
} from '../../src/inventory/index.js';

const m = (serialNumber: string, n: number, warehouseId: string, direction: 'IN' | 'OUT', sourceType: string, doc: string, warehouseType: string | null = null): MovimientoDeSerie => ({
    serialNumber,
    movementId: `m${n}`,
    warehouseId,
    warehouseType,
    direction,
    sourceType,
    sourceDocId: doc,
    occurredAt: `2026-10-${String(n).padStart(2, '0')}T10:00:00.000Z`,
});

describe('captura y validación', () => {
    it('parte lo capturado y normaliza', () => {
        expect(partirSeries(' sn-1, sn-2\nSN-3 ;; ')).toEqual(['SN-1', 'SN-2', 'SN-3']);
    });

    it('sin repetidas ni más series que piezas', () => {
        expect(validarSeries(3, ['A', 'B'])).toBeNull();
        expect(validarSeries(-2, ['A', 'B'])).toBeNull();
        expect(validarSeries(1, ['A', 'B'])).toBe('Son 2 series y el renglón mueve 1.');
        expect(validarSeries(3, ['a', 'A '])).toBe('La serie A está dos veces.');
        expect(validarSeries(3, ['  '])).toBe('Hay una serie vacía.');
    });
});

describe('estado derivado de los movimientos', () => {
    const movs = [
        m('A', 1, 'alm', 'IN', 'PURCHASE', 'CW-1'),
        m('B', 1, 'alm', 'IN', 'PURCHASE', 'CW-1'),
        m('C', 2, 'alm', 'IN', 'PURCHASE', 'CW-2'),
        // A viaja al piso por tránsito y se vende; B se da de baja; C sigue en el almacén.
        m('A', 3, 'alm', 'OUT', 'TRANSFER', 'TW-1'),
        m('A', 4, 'tra', 'IN', 'TRANSFER', 'TW-1', 'TRANSIT'),
        m('A', 5, 'tra', 'OUT', 'TRANSFER', 'TW-1', 'TRANSIT'),
        m('A', 6, 'piso', 'IN', 'TRANSFER', 'TW-1'),
        m('A', 7, 'piso', 'OUT', 'SALE', 'T-9'),
        m('B', 8, 'alm', 'OUT', 'MERMA', 'AW-1'),
    ];

    it('lo dice el último movimiento', () => {
        const [a, b, c] = estadosDeSeries(movs);
        expect(a).toMatchObject({ serialNumber: 'A', status: 'SOLD', warehouseId: null, receivedDocId: 'CW-1', soldDocId: 'T-9', soldAt: '2026-10-07T10:00:00.000Z' });
        expect(b).toMatchObject({ status: 'WRITTEN_OFF', warehouseId: null });
        expect(c).toMatchObject({ status: 'IN_STOCK', warehouseId: 'alm', inWarehouseSince: '2026-10-02T10:00:00.000Z' });
        expect(estadoDeSerie(movs.filter((x) => x.serialNumber === 'A' && x.movementId <= 'm4'))!.status).toBe('IN_TRANSIT');
        expect(estadoDeSerie([m('Z', 1, 'alm', 'IN', 'PURCHASE', 'CW'), m('Z', 2, 'alm', 'OUT', 'PURCHASE_RETURN', 'CW')])!.status).toBe('RETURNED_TO_SUPPLIER');
        expect(estadoDeSerie([])).toBeNull();
    });

    it('qué sale primero de una bodega y qué sigue a un original', () => {
        const estados = estadosDeSeries([...movs, m('D', 1, 'alm', 'IN', 'ADJUSTMENT', 'AW-0')]);
        expect(seriesEnBodega(estados, 'alm')).toEqual(['D', 'C']);
        expect(tomarSeries(1, ['D', 'C'])).toEqual(['D']);
        expect(tomarSeries(5, ['D', 'C'], ['c', 'A', 'B'])).toEqual(['C']);
        expect(tomarSeries(0, ['D'])).toEqual([]);
    });
});

describe('garantía', () => {
    it('meses desde la venta, al último día si el mes es corto', () => {
        expect(garantiaHasta('2026-01-31T18:00:00.000Z', 1)).toBe('2026-02-28');
        expect(garantiaHasta('2026-11-02T10:00:00.000Z', 12)).toBe('2027-11-02');
        expect(garantiaHasta(null, 12)).toBeNull();
        expect(garantiaHasta('2026-11-02', 0)).toBeNull();
    });
});
