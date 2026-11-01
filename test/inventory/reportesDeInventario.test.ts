/**
 * Los mismos casos que `ReportesDeInventarioTests` del escritorio: si una punta cambia la regla,
 * la otra lo delata.
 */
import { describe, expect, it } from 'vitest';
import {
    armarKardex,
    armarResumenDeMovimientos,
    armarValuacion,
    pasoDeExistencia,
    paresDelPeriodo,
    EXISTENCIA_VACIA,
    INVENTORY_REPORT_SCHEMAS,
    type MovimientoDeKardex,
    type FilaDeExistencia,
    type ParDelPeriodo,
} from '../../src/inventory/index.js';

const mov = (
    id: string,
    dia: string,
    warehouseId: string,
    direction: 'IN' | 'OUT',
    quantity: number,
    unitCost: number,
    sourceType: MovimientoDeKardex['sourceType']
): MovimientoDeKardex & { productId: string } => ({
    id,
    productId: 'pan',
    occurredAt: `${dia}T18:00:00.000Z`,
    warehouseId,
    warehouseName: warehouseId === 'a' ? 'Almacén' : 'Piso',
    direction,
    quantity,
    unitCost,
    sourceType,
    sourceDocId: null,
});

// El vector: 10 a $5 en el almacén; 10 a $7; vende 4 (costo 0 en la fila); pasa 6 al piso; el piso vende 1.
const KARDEX = [
    mov('m1', '2026-09-01', 'a', 'IN', 10, 5, 'INITIAL'),
    mov('m2', '2026-10-02', 'a', 'IN', 10, 7, 'PURCHASE'),
    mov('m3', '2026-10-03', 'a', 'OUT', 4, 0, 'SALE'),
    mov('m4', '2026-10-04', 'a', 'OUT', 6, 6, 'TRANSFER'),
    mov('m5', '2026-10-04', 'b', 'IN', 6, 6, 'TRANSFER'),
    mov('m6', '2026-10-05', 'b', 'OUT', 1, 0, 'SALE'),
    mov('m7', '2026-11-01', 'a', 'IN', 100, 9, 'PURCHASE'),
];
const OCT = new Date('2026-10-01T06:00:00.000Z');
const NOV = new Date('2026-11-01T06:00:00.000Z');

describe('pasoDeExistencia (la regla de la 0109)', () => {
    it('pondera la entrada, la salida no mueve el promedio, sin existencia el promedio es el de la entrada', () => {
        let e = pasoDeExistencia(EXISTENCIA_VACIA, 'IN', 10, 5);
        e = pasoDeExistencia(e, 'IN', 10, 7);
        expect(e).toEqual({ onHand: 20, averageCost: 6 });
        e = pasoDeExistencia(e, 'OUT', 20, 0);
        expect(e).toEqual({ onHand: 0, averageCost: 6 });
        e = pasoDeExistencia(e, 'IN', 10, 9);
        expect(e.averageCost).toBe(9);
        expect(pasoDeExistencia(EXISTENCIA_VACIA, 'IN', 1, -3).averageCost).toBe(0);
    });
});

describe('armarKardex', () => {
    it('abre con lo anterior, las salidas salen al promedio y varias bodegas se suman', () => {
        const { rows, totals } = armarKardex(KARDEX, OCT, NOV);
        expect(totals).toEqual({
            openingQuantity: 10,
            openingValue: 50,
            quantityIn: 16,
            quantityOut: 11,
            valueIn: 106,
            valueOut: 66,
            closingQuantity: 15,
            closingValue: 90,
        });
        expect(rows.map((r) => r.movementId)).toEqual(['m2', 'm3', 'm4', 'm5', 'm6']);
        // La venta sale a $6 (el promedio), no a $0 como está escrita.
        expect(rows[1]).toMatchObject({ quantityOut: 4, unitCost: 6, balanceQuantity: 16, balanceValue: 96, balanceAverageCost: 6 });
        // El traspaso: sale del almacén y entra al piso; el consolidado no cambia de valor.
        expect(rows[3]).toMatchObject({ balanceQuantity: 16, balanceValue: 96 });
    });

    it('una sola bodega es el kárdex del par', () => {
        const { totals } = armarKardex(KARDEX.filter((m) => m.warehouseId === 'b'), OCT, NOV);
        expect(totals).toMatchObject({ openingQuantity: 0, closingQuantity: 5, closingValue: 30 });
    });

    it('sin movimientos en el rango, abre y cierra igual', () => {
        const { rows, totals } = armarKardex(KARDEX, new Date('2026-09-10T00:00:00Z'), new Date('2026-09-20T00:00:00Z'));
        expect(rows).toEqual([]);
        expect(totals).toMatchObject({ openingQuantity: 10, closingQuantity: 10, openingValue: 50, closingValue: 50 });
    });
});

const fila = (productId: string, nombre: string, cat: string | null, bodega: string, onHand: number, costo: number): FilaDeExistencia => ({
    productId,
    productCode: null,
    productName: nombre,
    unit: 'pza',
    categoryId: cat,
    categoryName: cat ? cat.toUpperCase() : null,
    warehouseId: bodega,
    warehouseName: bodega === 'a' ? 'Almacén' : 'Piso',
    onHand,
    averageCost: costo,
});
const EXISTENCIAS = [
    fila('pan', 'Pan', 'pan', 'a', 10, 6),
    fila('pan', 'Pan', 'pan', 'b', 5, 6),
    fila('leche', 'Leche', 'lacteos', 'a', 3, 20),
    fila('sal', 'Sal', null, 'a', 0, 4),
];

describe('armarValuacion', () => {
    it('a una fecha: un renglón por producto × bodega, sin ceros, con su % del total', () => {
        const { rows, totals } = armarValuacion(EXISTENCIAS, null, false);
        expect(totals).toEqual({ onHand: 18, value: 150 });
        expect(rows.map((r) => `${r.productName}/${r.warehouseName}/${r.value}/${r.share}`)).toEqual([
            'Leche/Almacén/60/40',
            'Pan/Almacén/60/40',
            'Pan/Piso/30/20',
        ]);
        expect(armarValuacion(EXISTENCIAS, null, true).rows).toHaveLength(4);
    });

    it('por categoría: de mayor a menor valor, «Sin categoría» incluida si se piden ceros', () => {
        const { rows } = armarValuacion(EXISTENCIAS, 'CATEGORY', true);
        expect(rows.map((r) => `${r.groupLabel}/${r.onHand}/${r.averageCost}/${r.value}`)).toEqual([
            'PAN/15/6/90',
            'LACTEOS/3/20/60',
            'Sin categoría/0/0/0',
        ]);
    });
});

describe('resumen de movimientos', () => {
    it('inicial + entradas − salidas = final, por bodega', () => {
        const base = paresDelPeriodo(KARDEX, OCT, NOV);
        const pares: ParDelPeriodo[] = base.map((p) => ({
            ...p,
            productName: 'Pan',
            categoryId: 'pan',
            categoryName: 'PAN',
            warehouseName: p.warehouseId === 'a' ? 'Almacén' : 'Piso',
        }));
        const { rows, totals } = armarResumenDeMovimientos(pares, 'WAREHOUSE');
        expect(rows).toEqual([
            {
                groupKey: 'a',
                groupLabel: 'Almacén',
                openingQuantity: 10,
                openingValue: 50,
                inBySource: { PURCHASE: 10 },
                outBySource: { SALE: 4, TRANSFER: 6 },
                closingQuantity: 10,
                closingValue: 60,
            },
            {
                groupKey: 'b',
                groupLabel: 'Piso',
                openingQuantity: 0,
                openingValue: 0,
                inBySource: { TRANSFER: 6 },
                outBySource: { SALE: 1 },
                closingQuantity: 5,
                closingValue: 30,
            },
        ]);
        expect(totals).toEqual({ openingQuantity: 10, openingValue: 50, closingQuantity: 15, closingValue: 90 });
    });
});

describe('esquemas de los reportes', () => {
    it('las fechas son civiles', () => {
        expect(INVENTORY_REPORT_SCHEMAS.STOCK_AT_DATE.safeParse({ asOf: '2026-12-31' }).success).toBe(true);
        expect(INVENTORY_REPORT_SCHEMAS.STOCK_AT_DATE.safeParse({ asOf: '2026-12-31T10:00:00Z' }).success).toBe(false);
        expect(INVENTORY_REPORT_SCHEMAS.KARDEX.safeParse({ productId: '00000000-0000-4000-8000-000000000001', dateFrom: '2026-10-01', dateTo: '2026-10-31' }).success).toBe(true);
    });
});
