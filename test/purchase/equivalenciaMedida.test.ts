import { describe, expect, it } from 'vitest';
import { cantidadBaseRecibida, costoBaseRecibido, factorMedido, rangoDeMediciones } from '../../src/purchase/index.js';

/** U-T3 · Espejo: `EquivalenciaMedidaTests.cs` (escritorio), mismos casos. */
describe('equivalencia medida al recibir', () => {
    it('lo contado manda sobre el factor estimado', () => {
        expect(cantidadBaseRecibida(540, 0.5556, 300)).toBe(300);
        expect(cantidadBaseRecibida(12, 12)).toBe(144);
        expect(cantidadBaseRecibida(12, 12, null)).toBe(144);
    });

    it('el costo por tapa sale del importe entre lo contado: 16,200 ÷ 300 = 54', () => {
        expect(costoBaseRecibido(30, 540, 0.5556, 300)).toBe(54);
        expect(costoBaseRecibido(240, 2, 12)).toBe(20);
    });

    it('la equivalencia de la entrega y el rango de las últimas', () => {
        expect(factorMedido(540, 300)).toBe(0.5556);
        expect(factorMedido(0, 300)).toBeNull();
        expect(rangoDeMediciones([0.5, 0.55, 0.6, 0.52, 0.58, 0.54])).toEqual({ min: 0.52, max: 0.6, promedio: 0.558, n: 5 });
        expect(rangoDeMediciones([])).toBeNull();
    });
});
