/** I9c · Armado y desarmado de kits. Los mismos vectores que `ReglasDeArmadoTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import { planDeArmado, semillaDeArmado, type ComponenteDeProducto } from '../../src/product/index.js';

const comps: ComponenteDeProducto[] = [
    { productId: 'pan', productName: 'Pan', unitId: null, quantity: 2, substituteGroup: null },
    { productId: 'cafe', productName: 'Café', unitId: 'bolsa', quantity: 0.5, substituteGroup: null },
];
const factores = new Map([['bolsa', 4]]);
const kit = { id: 'canasta', name: 'Canasta' };

describe('armado de kits', () => {
    it('armar saca los componentes a su costo y mete el kit al costo sumado', () => {
        const p = planDeArmado({
            assemblyId: 'a1', kit, cantidad: 3, componentes: comps, factores,
            existencias: new Map([['pan', { onHand: 10, cost: 3.5 }], ['cafe', { onHand: 6, cost: 12.25 }]]),
        });
        expect(p.bloqueo).toBeNull();
        // pan 6 × 3.5 = 21; café 3 × 0.5 × 4 = 6 × 12.25 = 73.5 → 94.5 / 3 = 31.5
        expect(p.unitCost).toBe(31.5);
        expect(p.movimientos).toEqual([
            { productId: 'pan', direction: 'OUT', quantity: 6, unitCost: 3.5, seed: 'stock:kit-assembly:a1:pan' },
            { productId: 'cafe', direction: 'OUT', quantity: 6, unitCost: 12.25, seed: 'stock:kit-assembly:a1:cafe' },
            { productId: 'canasta', direction: 'IN', quantity: 3, unitCost: 31.5, seed: 'stock:kit-assembly:a1:canasta' },
        ]);
    });

    it('no arma con lo que no hay, ni sin componentes, ni cero', () => {
        const existencias = new Map([['pan', { onHand: 5, cost: 1 }], ['cafe', { onHand: 100, cost: 1 }]]);
        expect(planDeArmado({ assemblyId: 'a', kit, cantidad: 3, componentes: comps, factores, existencias }).bloqueo).toBe('«Pan»: hay 5 y se necesitan 6.');
        expect(planDeArmado({ assemblyId: 'a', kit, cantidad: 1, componentes: [], factores, existencias }).bloqueo).toBe('«Canasta» no tiene componentes: agrégalos antes de armarlo.');
        expect(planDeArmado({ assemblyId: 'a', kit, cantidad: 0, componentes: comps, factores, existencias }).bloqueo).toBe('Armar cero no arma nada.');
    });

    it('desarmar saca el kit a su promedio y devuelve los componentes; no desarma lo que no está armado', () => {
        const existencias = new Map([['canasta', { onHand: 2, cost: 30 }], ['pan', { onHand: 0, cost: 3.5 }], ['cafe', { onHand: 0, cost: 12 }]]);
        const p = planDeArmado({ assemblyId: 'd1', kit, cantidad: -2, componentes: comps, factores, existencias });
        expect(p.bloqueo).toBeNull();
        expect(p.movimientos.map((m) => [m.productId, m.direction, m.quantity, m.unitCost])).toEqual([
            ['canasta', 'OUT', 2, 30],
            ['pan', 'IN', 4, 3.5],
            ['cafe', 'IN', 4, 12],
        ]);
        expect(planDeArmado({ assemblyId: 'd2', kit, cantidad: -3, componentes: comps, factores, existencias }).bloqueo).toBe(
            'De «Canasta» hay 2 armados y se quieren desarmar 3.'
        );
        expect(semillaDeArmado('x', 'y')).toBe('stock:kit-assembly:x:y');
    });
});
