/**
 * I6b · El plan de conteo cíclico. Los mismos vectores que `PlanDeConteoTests` del escritorio: una
 * tanda generada sin red en una punta tiene que ser la misma que la otra habría generado.
 */
import { describe, expect, it } from 'vitest';
import {
    coberturaDelPlan,
    diaDeLaSemana,
    fnv1a,
    proximaTanda,
    semillaDeTandaAutomatica,
    tocaTandaAutomatica,
    tandaDelPlan,
    type PlanParaTanda,
    type ProductoDelPlan,
} from '../../src/inventory/index.js';

const p = (
    productId: string,
    productName: string,
    abcClass: 'A' | 'B' | 'C',
    ultimoConteo: string | null,
    extra: Partial<ProductoDelPlan> = {}
): ProductoDelPlan => ({
    productId,
    productName,
    productCode: null,
    categoryId: null,
    existencia: 5,
    tieneNivel: false,
    abcClass,
    ultimoConteo,
    ultimaDiferencia: false,
    ...extra,
});

const HOY = '2026-11-01'; // domingo

const productos = [
    p('a1', 'Aceite', 'A', '2026-10-20'), // 12 días, freq 30 → 0.4: al día
    p('a2', 'Arroz', 'A', '2026-09-01'), // 61 días → 2.03
    p('b1', 'Bolillo', 'B', null), // nunca
    p('c1', 'Cerillos', 'C', '2026-01-01'), // 304 días / 180 → 1.69
    p('c2', 'Chicle', 'C', null, { existencia: 0 }), // fuera: sin existencia ni nivel
    p('n1', 'Nopal', 'C', '2026-10-30', { existencia: -3 }), // negativo
    p('d1', 'Detergente', 'B', '2026-10-31', { ultimaDiferencia: true, categoryId: 'limpieza' }),
    p('d2', 'Jabón', 'B', '2026-08-01', { categoryId: 'limpieza' }),
    p('d3', 'Cloro', 'B', null, { categoryId: 'limpieza', existencia: 0 }),
];

const plan = (cambios: Partial<PlanParaTanda> = {}): PlanParaTanda => ({
    strategy: 'ABC',
    frequencyDays: { A: 30, B: 90, C: 180 },
    categoryIds: [],
    itemsPerRun: 10,
    includeLastDiscrepancies: true,
    includeNegatives: true,
    ...cambios,
});

const ids = (xs: readonly ProductoDelPlan[]) => xs.map((x) => x.productId);

describe('tanda del plan', () => {
    it('ABC: primero lo urgente, luego lo más vencido (nunca contado al frente)', () => {
        // urgentes: n1 (negativo), d1 (diferencia). Vencidos: b1 (∞), a2 (2.03), c1 (1.69), d2 (92/90 = 1.02).
        expect(ids(tandaDelPlan(plan(), productos, { hoy: HOY, ronda: 0, semilla: 's' }))).toEqual(['n1', 'd1', 'b1', 'a2', 'c1', 'd2']);
    });

    it('sin urgentes y con tope', () => {
        const t = tandaDelPlan(plan({ includeNegatives: false, includeLastDiscrepancies: false, itemsPerRun: 2 }), productos, { hoy: HOY, ronda: 0, semilla: 's' });
        expect(ids(t)).toEqual(['b1', 'a2']);
    });

    it('rotación por categoría: la de la ronda, lo que hace más que no se cuenta primero, aunque esté en cero', () => {
        const rot = plan({ strategy: 'CATEGORY_ROTATION', categoryIds: ['otra', 'limpieza'], includeNegatives: false, includeLastDiscrepancies: false });
        expect(ids(tandaDelPlan(rot, productos, { hoy: HOY, ronda: 1, semilla: 's' }))).toEqual(['d3', 'd2', 'd1']);
        expect(ids(tandaDelPlan(rot, productos, { hoy: HOY, ronda: 0, semilla: 's' }))).toEqual([]);
        expect(ids(tandaDelPlan(rot, productos, { hoy: HOY, ronda: 3, semilla: 's' }))).toEqual(['d3', 'd2', 'd1']);
    });

    it('aleatorio: reproducible con la misma semilla, sobre lo que hay en la bodega', () => {
        const al = plan({ strategy: 'RANDOM', includeNegatives: false, includeLastDiscrepancies: false, itemsPerRun: 3 });
        const a = ids(tandaDelPlan(al, productos, { hoy: HOY, ronda: 0, semilla: 'conteo-1' }));
        expect(a).toEqual(ids(tandaDelPlan(al, productos, { hoy: HOY, ronda: 5, semilla: 'conteo-1' })));
        expect(a).toEqual(['c1', 'd1', 'd2']);
        expect(a).not.toContain('c2');
    });

    it('FNV-1a de 32 bits', () => {
        expect(fnv1a('')).toBe(2166136261);
        expect(fnv1a('a')).toBe(3826002220);
        expect(fnv1a('conteo-1:p1')).toBe(1804590168);
        expect(fnv1a('ñ')).toBe(111002361);
    });
});

describe('próxima tanda', () => {
    it('el primer día elegido desde hoy; desde mañana si hoy ya hubo', () => {
        expect(diaDeLaSemana(HOY)).toBe(0);
        expect(proximaTanda([1, 3, 5], null, HOY)).toBe('2026-11-02');
        expect(proximaTanda([0, 3], null, HOY)).toBe('2026-11-01');
        expect(proximaTanda([0, 3], '2026-11-01', HOY)).toBe('2026-11-04');
        expect(proximaTanda([0], '2026-11-01', HOY)).toBe('2026-11-08');
        expect(proximaTanda([], null, HOY)).toBeNull();
    });
});

describe('cobertura', () => {
    it('por clase, sobre lo que tiene existencia o nivel', () => {
        expect(coberturaDelPlan(productos, null, HOY)).toEqual([
            { abcClass: 'A', products: 2, countedOnTime: 1, overdue: 1, accuracy: 1 },
            { abcClass: 'B', products: 3, countedOnTime: 1, overdue: 2, accuracy: 0.5 },
            { abcClass: 'C', products: 2, countedOnTime: 1, overdue: 1, accuracy: 1 },
        ]);
    });
});

describe('tanda automática (2.84.0)', () => {
    const plan = { status: 'ACTIVE', autoRun: true, weekdays: [1, 3] };
    it('toca en sus días, una vez al día', () => {
        expect(tocaTandaAutomatica(plan, null, '2026-11-02')).toBe(true); // lunes
        expect(tocaTandaAutomatica(plan, '2026-11-02', '2026-11-02')).toBe(false); // ya se generó hoy
        expect(tocaTandaAutomatica(plan, '2026-10-28', '2026-11-03')).toBe(false); // martes
        expect(tocaTandaAutomatica(plan, '2026-11-02', '2026-11-04')).toBe(true); // miércoles
    });
    it('sin autoRun o en pausa, nunca', () => {
        expect(tocaTandaAutomatica({ ...plan, autoRun: false }, null, '2026-11-02')).toBe(false);
        expect(tocaTandaAutomatica({ ...plan, status: 'PAUSED' }, null, '2026-11-02')).toBe(false);
        expect(tocaTandaAutomatica({ status: 'ACTIVE', weekdays: [1] }, null, '2026-11-02')).toBe(false);
    });
    it('la semilla del conteo', () => {
        expect(semillaDeTandaAutomatica('p1', '2026-11-02')).toBe('stock:count-plan-run:p1:2026-11-02');
    });
});
