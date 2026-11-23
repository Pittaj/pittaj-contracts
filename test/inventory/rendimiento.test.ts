import { describe, expect, it } from 'vitest';
import { cierrePorPesaje, existenciaVendibleEstimada, rendimientoAprendido } from '../../src/inventory/index.js';

/** U-T5 · Espejo: `RendimientoTests.cs` (escritorio), mismos casos. */
describe('rendimiento aprendido', () => {
    it('vendido ÷ (vendido + merma), con devoluciones restadas', () => {
        const r = rendimientoAprendido([
            { direction: 'IN', sourceType: 'PURCHASE', quantity: 10 },
            { direction: 'OUT', sourceType: 'SALE', quantity: 9 },
            { direction: 'IN', sourceType: 'RETURN', quantity: 0.5 },
            { direction: 'OUT', sourceType: 'MERMA', quantity: 1.5 },
        ]);
        expect(r).toEqual({ vendido: 8.5, merma: 1.5, rendimiento: 0.85 });
    });

    it('sin un cierre no se sabe: nulo, no 100 %', () => {
        expect(rendimientoAprendido([{ direction: 'OUT', sourceType: 'SALE', quantity: 9 }]).rendimiento).toBeNull();
    });

    it('existencia vendible y cierre por pesaje', () => {
        expect(existenciaVendibleEstimada(4, 0.85)).toBe(3.4);
        expect(existenciaVendibleEstimada(4, null)).toBe(4);
        expect(cierrePorPesaje(2.4, 1.9)).toEqual({ merma: 0.5, sobrante: 0 });
        expect(cierrePorPesaje(2.4, 0)).toEqual({ merma: 2.4, sobrante: 0 });
        expect(cierrePorPesaje(1, 1.2)).toEqual({ merma: 0, sobrante: 0.2 });
    });
});

import { alertaDeRendimiento, armarRendimiento, costoPorUnidadVendida } from '../../src/inventory/index.js';

/** U-T6 · Espejo: `RendimientoTests.cs` (escritorio). */
describe('reporte de rendimiento, alerta y costo por unidad vendida', () => {
    const base = { categoryId: 'cf', categoryName: 'Carnes frías' };
    const movs = [
        { ...base, productId: 'fud', productName: 'Jamón FUD', direction: 'IN' as const, sourceType: 'PURCHASE', quantity: 10, unitCost: 160 },
        { ...base, productId: 'fud', productName: 'Jamón FUD', direction: 'OUT' as const, sourceType: 'SALE', quantity: 8, unitCost: 0 },
        { ...base, productId: 'fud', productName: 'Jamón FUD', direction: 'OUT' as const, sourceType: 'MERMA', quantity: 2, unitCost: 160 },
        { ...base, productId: 'sal', productName: 'Salchicha', direction: 'IN' as const, sourceType: 'PURCHASE', quantity: 5, unitCost: 80 },
        { ...base, productId: 'sal', productName: 'Salchicha', direction: 'OUT' as const, sourceType: 'SALE', quantity: 4.75, unitCost: 0 },
        { ...base, productId: 'sal', productName: 'Salchicha', direction: 'OUT' as const, sourceType: 'MERMA', quantity: 0.25, unitCost: 80 },
    ];

    it('por categoría: costo de la merma, lo recuperado por el recorte y la merma neta', () => {
        const r = armarRendimiento(movs, [{ categoryId: 'cf', importe: 45 }], 'CATEGORY', 0.85);
        expect(r.rows).toEqual([
            { groupKey: 'cf', groupLabel: 'Carnes frías', entradas: 15, vendido: 12.75, merma: 2.25, rendimiento: 0.85, costoMerma: 340, recuperado: 45, mermaNeta: 295, bajo: false },
        ]);
        expect(r.totals).toEqual({ costoMerma: 340, recuperado: 45, mermaNeta: 295 });
    });

    it('por producto: marca el que rinde por debajo del mínimo', () => {
        const r = armarRendimiento(movs, [], 'PRODUCT', 0.85);
        expect(r.rows.map((x) => [x.groupLabel, x.rendimiento, x.bajo])).toEqual([
            ['Jamón FUD', 0.8, true],
            ['Salchicha', 0.95, false],
        ]);
    });

    it('la alerta y el costo de lo que de verdad se vende', () => {
        const a = alertaDeRendimiento({ productId: 'fud', productName: 'Jamón FUD', productCode: null, rendimiento: 0.8, costoMerma: 320, changedAt: '2026-11-23' }, 0.85);
        expect([a?.kind, a?.severity, a?.message, a?.valueAtRisk]).toEqual(['LOW_YIELD', 'MEDIUM', 'Jamón FUD: rinde 80 % (mínimo 85 %)', 320]);
        expect(alertaDeRendimiento({ productId: 'x', productName: 'X', productCode: null, rendimiento: 0.9, costoMerma: 0, changedAt: '' })).toBeNull();
        expect(costoPorUnidadVendida(139.25, 0.85)).toBe(163.8235);
        expect(costoPorUnidadVendida(139.25, null)).toBe(139.25);
    });
});
