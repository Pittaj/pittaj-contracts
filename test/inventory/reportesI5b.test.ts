/**
 * Los mismos casos que `ReportesI5bTests` del escritorio (I5b).
 */
import { describe, expect, it } from 'vitest';
import {
    armarExactitud,
    armarMerma,
    armarRotacionAbc,
    armarSinMovimiento,
    armarTablero,
    consumoDelPar,
    type MovimientoDeMerma,
    type PasoDelPeriodo,
} from '../../src/inventory/index.js';

const paso = (id: string, dia: string, direction: 'IN' | 'OUT', quantity: number, unitCost: number, sourceType: PasoDelPeriodo['sourceType']): PasoDelPeriodo => ({
    id,
    occurredAt: `${dia}T18:00:00.000Z`,
    direction,
    quantity,
    unitCost,
    sourceType,
});

describe('consumoDelPar (costo de venta)', () => {
    it('la venta sale al promedio; la devolución lo regresa al costo con que entra', () => {
        // Almacén: abre con 10 a $5; compra 10 a $7; vende 4; traspasa 6.
        const a = consumoDelPar({ onHand: 10, averageCost: 5 }, [
            paso('m2', '2026-10-02', 'IN', 10, 7, 'PURCHASE'),
            paso('m3', '2026-10-03', 'OUT', 4, 0, 'SALE'),
            paso('m4', '2026-10-04', 'OUT', 6, 6, 'TRANSFER'),
        ]);
        expect(a.cogs).toBe(24);
        expect(a.cierre).toEqual({ onHand: 10, averageCost: 6 });
        const conDevolucion = consumoDelPar({ onHand: 10, averageCost: 6 }, [
            paso('x1', '2026-10-05', 'OUT', 2, 0, 'SALE'),
            paso('x2', '2026-10-06', 'IN', 1, 6, 'RETURN'),
        ]);
        expect(conDevolucion.cogs).toBe(6);
    });
});

describe('armarRotacionAbc', () => {
    it('rotación y días de inventario del vector; sin venta, nulos y clase C', () => {
        const { rows } = armarRotacionAbc(
            [
                { productId: 'pan', productCode: 'PAN', productName: 'Pan', cogs: 30, valorInicial: 50, valorFinal: 90 },
                { productId: 'leche', productCode: 'LEC', productName: 'Leche', cogs: 0, valorInicial: 60, valorFinal: 60 },
            ],
            31,
            { cutoffA: 80, cutoffB: 95 }
        );
        expect(rows[0]).toMatchObject({ productName: 'Pan', abcClass: 'A', cogs: 30, averageInventoryValue: 70, turnover: 0.43, daysOfInventory: 72.3, cumulativeShare: 100 });
        expect(rows[1]).toMatchObject({ productName: 'Leche', abcClass: 'C', turnover: null, daysOfInventory: null });
    });

    it('la clase la decide el acumulado ANTES del producto', () => {
        const p = (id: string, cogs: number) => ({ productId: id, productCode: null, productName: id, cogs, valorInicial: 10, valorFinal: 10 });
        const { rows } = armarRotacionAbc([p('d', 10), p('a', 900), p('c', 30), p('b', 60)], 30, { cutoffA: 80, cutoffB: 95 });
        expect(rows.map((r) => `${r.productId}:${r.abcClass}:${r.cumulativeShare}`)).toEqual(['a:A:90', 'b:B:96', 'c:C:99', 'd:C:100']);
        expect(armarRotacionAbc([p('a', 900), p('b', 60)], 30, { cutoffA: 80, cutoffB: 95 }, 'B').rows.map((r) => r.productId)).toEqual(['b']);
    });
});

describe('armarSinMovimiento', () => {
    const pares = [
        { productId: 'pan', productCode: 'PAN', productName: 'Pan', warehouseName: 'Almacén', onHand: 10, averageCost: 6, firstMovementAt: '2026-09-01T18:00:00.000Z', lastMovementAt: '2026-11-01T18:00:00.000Z', lastSaleAt: '2026-10-03T18:00:00.000Z' },
        { productId: 'leche', productCode: 'LEC', productName: 'Leche', warehouseName: 'Almacén', onHand: 3, averageCost: 20, firstMovementAt: '2026-09-01T18:00:00.000Z', lastMovementAt: '2026-09-01T18:00:00.000Z', lastSaleAt: null },
        { productId: 'sal', productCode: null, productName: 'Sal', warehouseName: 'Almacén', onHand: 0, averageCost: 4, firstMovementAt: '2026-01-01T18:00:00.000Z', lastMovementAt: '2026-01-01T18:00:00.000Z', lastSaleAt: null },
    ];
    const ahora = new Date('2026-12-31T18:00:00.000Z');

    it('sin venta en 60 días: lo que nunca se vendió cuenta desde su primer movimiento; sin existencia no sale', () => {
        const { rows, totals } = armarSinMovimiento(pares, ahora, 60, true);
        expect(rows.map((r) => `${r.productName}:${r.daysIdle}:${r.value}`)).toEqual(['Leche:121:60', 'Pan:89:60']);
        expect(totals).toEqual({ value: 120, products: 2 });
    });

    it('sin ningún movimiento: el traspaso de noviembre cuenta', () => {
        // A igual dinero parado, primero el que lleva más días quieto.
        expect(armarSinMovimiento(pares, ahora, 60, false).rows.map((r) => r.productName)).toEqual(['Leche', 'Pan']);
        expect(armarSinMovimiento(pares, ahora, 61, false).rows.map((r) => r.productName)).toEqual(['Leche']);
    });
});

const merma = (o: Partial<MovimientoDeMerma>): MovimientoDeMerma => ({
    productId: 'pan',
    productName: 'Pan',
    categoryId: 'pan',
    categoryName: 'PAN',
    warehouseId: 'a',
    warehouseName: 'Almacén',
    sourceType: 'ADJUSTMENT',
    reason: null,
    direction: 'OUT',
    quantity: 1,
    unitCost: 5,
    sourceDocId: null,
    ...o,
});

describe('armarMerma', () => {
    const movs = [
        merma({ sourceType: 'MERMA', quantity: 2, sourceDocId: 'AJ-1' }),
        merma({ reason: 'THEFT', quantity: 1, unitCost: 20, productId: 'leche', productName: 'Leche', sourceDocId: 'AJ-2' }),
        merma({ sourceType: 'COUNT', reason: 'COUNT', direction: 'IN', quantity: 1, sourceDocId: 'CF-1' }),
        merma({ sourceType: 'INITIAL', direction: 'IN', quantity: 100 }),
        merma({ reason: 'OPENING', direction: 'IN', quantity: 50 }),
    ];

    it('por motivo, al costo asentado; el sobrante resta y el inicial no es merma', () => {
        const { rows, totals } = armarMerma(movs, 'REASON', 30);
        expect(rows.map((r) => `${r.groupLabel}:${r.value}:${r.pctOfCogs}:${r.documents}`)).toEqual([
            'Robo o faltante:20:66.67:1',
            'Merma:10:33.33:1',
            'Conteo físico:-5:-16.67:1',
        ]);
        expect(totals).toEqual({ value: 25, pctOfCogs: 83.33 });
    });

    it('por producto, y sin costo de venta el % es nulo', () => {
        const { rows, totals } = armarMerma(movs, 'PRODUCT', null);
        expect(rows.map((r) => `${r.groupLabel}:${r.quantity}:${r.value}`)).toEqual(['Leche:1:20', 'Pan:1:5']);
        expect(totals.pctOfCogs).toBeNull();
    });
});

describe('armarExactitud', () => {
    it('por conteo, del más reciente; un renglón sin contar no cuenta', () => {
        const { rows, totals } = armarExactitud([
            {
                countId: 'c1',
                countNumber: 'CF-1',
                appliedAt: '2026-10-10T18:00:00.000Z',
                warehouseName: 'Almacén',
                lines: [
                    { expected: 10, counted: 10, unitCost: 5 },
                    { expected: 5, counted: 4, unitCost: 20 },
                    { expected: 3, counted: null, unitCost: 1 },
                ],
            },
            { countId: 'c2', countNumber: 'CF-2', appliedAt: '2026-10-20T18:00:00.000Z', warehouseName: 'Piso', lines: [{ expected: 2, counted: 3, unitCost: 5 }] },
        ]);
        expect(rows.map((r) => `${r.countNumber}:${r.linesCounted}:${r.linesMatched}:${r.accuracy}:${r.differenceValue}:${r.absoluteDifferenceValue}`)).toEqual([
            'CF-2:1:0:0:5:5',
            'CF-1:2:1:50:-20:20',
        ]);
        expect(totals).toEqual({ linesCounted: 3, linesMatched: 1, accuracy: 33.3, differenceValue: -15, absoluteDifferenceValue: 25 });
    });
});

describe('el tablero con costo de venta (I5b)', () => {
    const base = {
        asOf: '2026-10-31',
        existencias: [{ productId: 'pan', warehouseId: 'a', warehouseName: 'Almacén', onHand: 15, averageCost: 6 }],
        valorHace30: 50,
        cajones: { lowStock: 0, negative: 0, transfersInTransit: 0, transfersToReceive: 0, countsOpen: 0, adjustmentsDraft: 0 },
        renglonesContados: 0,
        renglonesCuadrados: 0,
        merma: 3,
    };
    it('rotación, días y % de merma; sin costo de venta, nulos', () => {
        const t = armarTablero({ ...base, costoDeVenta30: 30 });
        expect(t.turnover).toBe(0.43);
        expect(t.daysOfInventory).toBe(70);
        expect(t.shrinkage30d).toEqual({ value: 3, pctOfCogs: 10 });
        const sin = armarTablero(base);
        expect([sin.turnover, sin.daysOfInventory, sin.shrinkage30d.pctOfCogs]).toEqual([null, null, null]);
    });
});
