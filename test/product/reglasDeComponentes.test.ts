/** I9b · Kits y combos. Los mismos vectores que `ReglasDeComponentesTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import {
    bloqueoDeComponentes,
    costoDeComponentes,
    cuantosAlcanzan,
    movimientosDeCombo,
    componentesQueSeMueven,
    componentesTrasFusion,
    gruposDeSustitucion,
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

describe('grupos de sustitución (2.82.0)', () => {
    const g = (id: string, q: number, grupo: string | null) => ({ productId: id, productName: id, unitId: null, quantity: q, substituteGroup: grupo });
    const comps = [g('pan', 1, null), g('cola', 1, 'refresco'), g('limon', 1, 'refresco'), g('papas', 1, 'guarnicion'), g('ensalada', 1, 'guarnicion')];
    it('se mueve uno por grupo: el elegido o el primero', () => {
        expect(componentesQueSeMueven(comps).map((c) => c.productId)).toEqual(['pan', 'cola', 'papas']);
        expect(componentesQueSeMueven(comps, { refresco: 'limon' }).map((c) => c.productId)).toEqual(['pan', 'limon', 'papas']);
        // Lo que no es del grupo no cuenta.
        expect(componentesQueSeMueven(comps, { refresco: 'pan' }).map((c) => c.productId)).toEqual(['pan', 'cola', 'papas']);
        expect(movimientosDeCombo(2, comps, new Map(), 's', { guarnicion: 'ensalada' }).map((m) => [m.productId, m.quantityBase])).toEqual([
            ['pan', 2], ['cola', 2], ['ensalada', 2],
        ]);
    });
    it('los grupos que se pueden elegir, el costo y cuántos alcanzan', () => {
        expect(gruposDeSustitucion(comps).map((x) => [x.group, x.options.map((o) => o.productId)])).toEqual([
            ['refresco', ['cola', 'limon']], ['guarnicion', ['papas', 'ensalada']],
        ]);
        expect(costoDeComponentes(comps, new Map(), new Map([['pan', 5], ['cola', 10], ['limon', 99], ['papas', 7], ['ensalada', 99]]))).toBe(22);
        // Refresco: 2 + 3 = 5; guarnición: 0 + 4 = 4; pan: 9 → 4.
        expect(cuantosAlcanzan(comps, new Map(), new Map([['pan', 9], ['cola', 2], ['limon', 3], ['papas', 0], ['ensalada', 4]]))).toBe(4);
    });
});

describe('fusión de productos (2.82.0)', () => {
    const k = (id: string, q: number, unit: string | null = null, grupo: string | null = null) => ({ productId: id, productName: id, unitId: unit, quantity: q, substituteGroup: grupo });
    const f = new Map([['caja-12', 12], ['six', 6]]);
    it('re-apunta en unidad base, o suma al que ya estaba en su unidad', () => {
        expect(componentesTrasFusion([k('pan', 2), k('coca', 1, 'caja-12')], 'coca', { id: 'cola', name: 'Cola' }, f)).toEqual([
            k('pan', 2), { productId: 'cola', productName: 'Cola', unitId: null, quantity: 12, substituteGroup: null },
        ]);
        expect(componentesTrasFusion([k('coca', 12), k('cola', 1, 'six')], 'coca', { id: 'cola', name: 'Cola' }, f)).toEqual([k('cola', 3, 'six')]);
        expect(componentesTrasFusion([k('pan', 2)], 'coca', { id: 'cola', name: 'Cola' }, f)).toBeNull();
    });
});
