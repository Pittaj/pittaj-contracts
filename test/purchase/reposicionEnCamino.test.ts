/**
 * I5c · Lo que ya viene en camino no se vuelve a pedir. Los mismos casos que
 * `ReposicionEnCaminoTests` del escritorio.
 */
import { describe, expect, it } from 'vitest';
import { cantidadSugerida, diasQueAlcanza, explicar, hayQuePedir, posicion, type ProductoAReponer } from '../../src/purchase/index.js';

const base: ProductoAReponer = { existencia: 4, minimo: 10, puntoDeReorden: 12, ventaSemanal: 14, diasDeEntrega: 3, piezasPorCaja: 6 };

describe('reposición con lo que viene en camino', () => {
    it('sin nada en camino es la cuenta de siempre', () => {
        // 2 semanas (28) + mínimo (10) − 4 = 34 → a la baja en cajas de 6 = 30.
        expect(hayQuePedir(base)).toBe(true);
        expect(cantidadSugerida(base)).toBe(30);
        expect(posicion(base)).toBe(4);
    });

    it('lo que viene se descuenta de lo que falta, y los días que alcanza siguen siendo de lo que hay', () => {
        const p = { ...base, enCamino: 12 };
        expect(cantidadSugerida(p)).toBe(18); // 28 + 10 − 4 − 12 = 22 → 18
        expect(diasQueAlcanza(p)).toBe(2);
        expect(explicar(p)).toContain('28 + 10 − 4 − 12 = 22');
    });

    it('si con lo que viene se pasa del reorden, ya se pidió: no hay que pedir otra vez', () => {
        const p = { ...base, enCamino: 9 };
        expect(hayQuePedir(p)).toBe(false);
        expect(hayQuePedir({ ...base, enCamino: 8 })).toBe(true);
    });

    it('un negativo no resta', () => {
        expect(posicion({ ...base, enCamino: -5 })).toBe(4);
    });
});
