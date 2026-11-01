/** I9b · Kits y combos. Los mismos vectores que `ReglasDeComponentesTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import {
    bloqueoDeComponentes,
    costoDeComponentes,
    cuantosAlcanzan,
    movimientosDeCombo,
    semillaDeComponente,
    type ComponenteDeProducto,
} from '../../src/product/index.js';

const c = (productId: string, quantity: number, unitId: string | null = null): ComponenteDeProducto => ({
    productId,
    productName: productId,
    unitId,
    quantity,
    substituteGroup: null,
});
const catalogo = new Map(
    [
        ['pan', 'SIMPLE'],
        ['carne', 'SIMPLE'],
        ['refresco', 'SIMPLE'],
        ['otro-combo', 'COMBO'],
        ['playera', 'VARIABLE'],
        ['envio', 'SERVICE'],
        ['canasta', 'KIT'],
    ].map(([id, type]) => [id!, { id: id!, type: type! }] as const)
);
const factores = new Map([['caja-12', 12]]);

describe('qué se puede guardar', () => {
    it('solo kits y combos, sin repetir, sin sí mismo, sin combos, plantillas ni servicios', () => {
        const combo = { id: 'hamburguesa', type: 'COMBO' };
        expect(bloqueoDeComponentes(combo, [c('pan', 1), c('carne', 1), c('canasta', 1)], catalogo)).toBeNull();
        expect(bloqueoDeComponentes({ id: 'pan', type: 'SIMPLE' }, [c('carne', 1)], catalogo)).toBe('Solo un kit o un combo lleva componentes.');
        expect(bloqueoDeComponentes(combo, [], catalogo)).toBe('Agrega al menos un componente.');
        expect(bloqueoDeComponentes(combo, [c('hamburguesa', 1)], catalogo)).toBe('Un producto no puede ser componente de sí mismo.');
        expect(bloqueoDeComponentes(combo, [c('pan', 1), c('pan', 2)], catalogo)).toBe('«pan» está dos veces: súmalo en un solo renglón.');
        expect(bloqueoDeComponentes(combo, [c('pan', 0)], catalogo)).toBe('La cantidad de «pan» tiene que ser mayor que cero.');
        expect(bloqueoDeComponentes(combo, [c('fantasma', 1)], catalogo)).toBe('«fantasma» ya no está en el catálogo.');
        expect(bloqueoDeComponentes(combo, [c('otro-combo', 1)], catalogo)).toContain('es un combo');
        expect(bloqueoDeComponentes(combo, [c('playera', 1)], catalogo)).toContain('plantilla con variantes');
        expect(bloqueoDeComponentes(combo, [c('envio', 1)], catalogo)).toContain('es un servicio');
    });
});

describe('qué mueve un combo', () => {
    it('cada componente por su cantidad, su unidad y lo vendido', () => {
        expect(movimientosDeCombo(3, [c('pan', 2), c('refresco', 1, 'caja-12'), c('carne', 0.25)], factores, 'stock:t1:l1')).toEqual([
            { productId: 'pan', quantityBase: 6, seed: 'stock:t1:l1:component:pan' },
            { productId: 'refresco', quantityBase: 36, seed: 'stock:t1:l1:component:refresco' },
            { productId: 'carne', quantityBase: 0.75, seed: 'stock:t1:l1:component:carne' },
        ]);
        expect(semillaDeComponente('x', 'p')).toBe('x:component:p');
    });

    it('costo armado y cuántos alcanzan', () => {
        const comps = [c('pan', 2), c('carne', 0.25), c('refresco', 1, 'caja-12')];
        expect(costoDeComponentes(comps, factores, new Map([['pan', 3.5], ['carne', 180], ['refresco', 1.25]]))).toBe(67);
        expect(cuantosAlcanzan(comps, factores, new Map([['pan', 9], ['carne', 1], ['refresco', 100]]))).toBe(4);
        expect(cuantosAlcanzan(comps, factores, new Map([['pan', -3], ['carne', 5], ['refresco', 100]]))).toBe(0);
        expect(cuantosAlcanzan([], factores, new Map())).toBe(0);
    });
});
