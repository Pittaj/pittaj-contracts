/** (2.85.0) La diferencia de un armado de kits. */
import { describe, expect, it } from 'vitest';
import { diferenciaDeArmado, HUECO_DIFERENCIA_DE_ARMADO } from '../../src/inventory/index.js';


describe('(2.85.0) diferenciaDeArmado', () => {
    it('armar a la suma de los componentes no deja diferencia', () => {
        expect(diferenciaDeArmado([
            { direction: 'OUT', quantity: 2, unitCost: 10 },
            { direction: 'OUT', quantity: 1, unitCost: 5.5 },
            { direction: 'IN', quantity: 1, unitCost: 25.5 },
        ])).toBe(0);
    });
    it('desarmar: el kit sale a su promedio y los componentes entran a los suyos', () => {
        expect(diferenciaDeArmado([
            { direction: 'OUT', quantity: 1, unitCost: 30 },
            { direction: 'IN', quantity: 2, unitCost: 10 },
            { direction: 'IN', quantity: 1, unitCost: 5.5 },
        ])).toBe(-4.5);
        expect(HUECO_DIFERENCIA_DE_ARMADO).toBe('INVENTORY_ADJUSTMENT');
    });
});
