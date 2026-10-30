import { describe, expect, it } from 'vitest';
import { armarTablero, exactitudDeConteos } from '../../src/inventory/index.js';

/** Espejo en el escritorio: `TableroDeInventarioTests.cs`, mismos casos y mismos números. */
describe('armarTablero', () => {
    const cajones = {
        lowStock: 2,
        negative: 1,
        transfersInTransit: 1,
        transfersToReceive: 0,
        countsOpen: 1,
        adjustmentsDraft: 3,
    };
    const t = armarTablero({
        asOf: '2026-10-30T12:00:00.000Z',
        existencias: [
            { productId: 'pan', warehouseId: 'b1', warehouseName: 'Centro', onHand: 10, averageCost: 2.5 },
            { productId: 'pan', warehouseId: 'b2', warehouseName: 'Norte', onHand: 4, averageCost: 2.5 },
            { productId: 'leche', warehouseId: 'b1', warehouseName: 'Centro', onHand: -2, averageCost: 10 },
            { productId: 'queso', warehouseId: 'b2', warehouseName: 'Norte', onHand: 0, averageCost: 80 },
        ],
        valorHace30: 20.333,
        cajones,
        renglonesContados: 3,
        renglonesCuadrados: 2,
        merma: 12.345,
    });

    it('el valor cuenta lo negativo (es lo que dice el kárdex) y el cambio es contra hace 30 días', () => {
        expect(t.totalValue).toBe(15);
        expect(t.totalValueDelta30d).toBe(-5.33);
    });
    it('productos con existencia: distintos y con más de cero', () => {
        expect(t.productsWithStock).toBe(1);
    });
    it('por bodega, de la que más vale a la que menos', () => {
        expect(t.byWarehouse).toEqual([
            { warehouseId: 'b2', warehouseName: 'Norte', value: 10, products: 1 },
            { warehouseId: 'b1', warehouseName: 'Centro', value: 5, products: 1 },
        ]);
    });
    it('lo que necesita el costo de venta va nulo; caducidades y reservas en cero', () => {
        expect(t).toMatchObject({ turnover: null, daysOfInventory: null, shrinkage30d: { value: 12.35, pctOfCogs: null } });
        expect(t.cajones).toEqual({ ...cajones, expiringSoon: 0, reservationsExpiring: 0 });
        expect(t.countAccuracy90d).toBe(66.7);
    });
    it('sin renglones contados la exactitud no es 100 %: es nula', () => {
        expect(exactitudDeConteos(0, 0)).toBeNull();
        expect(exactitudDeConteos(8, 8)).toBe(100);
    });
});
