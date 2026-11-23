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
