import { describe, expect, it } from 'vitest';
import { estadoDeNivel, sugerirNivel } from '../../src/inventory/index.js';

/** Espejo en el escritorio: `NivelDeExistenciaTests.cs`, mismos casos y mismos números. */
describe('estadoDeNivel', () => {
    const nivel = { minStock: 10, reorderPoint: 15, maxStock: 40 };
    it('bajo cero es negativo y cero es agotado, tenga nivel o no', () => {
        expect(estadoDeNivel(-1, nivel)).toBe('NEGATIVE');
        expect(estadoDeNivel(0, nivel)).toBe('OUT');
        expect(estadoDeNivel(0, null)).toBe('OUT');
    });
    it('bajo el mínimo, o en el punto de reorden, ya toca pedir', () => {
        expect(estadoDeNivel(9, nivel)).toBe('LOW');
        expect(estadoDeNivel(15, nivel)).toBe('LOW');
        expect(estadoDeNivel(16, nivel)).toBe('OK');
    });
    it('sobre el máximo es sobreinventario; sin máximo no hay tope', () => {
        expect(estadoDeNivel(41, nivel)).toBe('OVER');
        expect(estadoDeNivel(1000, { minStock: 10, reorderPoint: 0, maxStock: 0 })).toBe('OK');
    });
    it('sin nivel, cualquier existencia positiva está bien', () => {
        expect(estadoDeNivel(3, null)).toBe('OK');
    });
    it('acepta decimales', () => {
        expect(estadoDeNivel(2.4, { minStock: 2.5, reorderPoint: 0, maxStock: 0 })).toBe('LOW');
    });
});

describe('sugerirNivel', () => {
    const p = { safetyDays: 7, leadTimeDays: 5, coverageDays: 30, enteros: true };
    it('colchón, entrega y cobertura, siempre hacia arriba', () => {
        // 4.2 al día: 29.4 → 30 · 50.4 → 51 · 126
        expect(sugerirNivel(4.2, p)).toEqual({ minStock: 30, reorderPoint: 51, maxStock: 126 });
    });
    it('el máximo nunca queda bajo el reorden', () => {
        expect(sugerirNivel(1, { safetyDays: 10, leadTimeDays: 10, coverageDays: 5, enteros: true })).toEqual({
            minStock: 10,
            reorderPoint: 20,
            maxStock: 20,
        });
    });
    it('sin venta no se inventa un mínimo', () => {
        expect(sugerirNivel(0, p)).toEqual({ minStock: 0, reorderPoint: 0, maxStock: 0 });
    });
    it('en fracción redondea a centésimos hacia arriba', () => {
        expect(sugerirNivel(0.33, { ...p, enteros: false })).toEqual({ minStock: 2.31, reorderPoint: 3.96, maxStock: 9.9 });
    });
});
