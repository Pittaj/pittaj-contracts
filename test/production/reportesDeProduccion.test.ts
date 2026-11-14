import { describe, expect, it } from 'vitest';
import {
    aClavesDeProduccion,
    consumoEstandar,
    costosDeProduccion,
    deClavesDeProduccion,
    explicarSugerencia,
    intervaloDelPeriodo,
    mermaDeProduccion,
    PRODUCTION_SETTINGS_DEFAULT,
    produccionDelDia,
    rendimientoDeProduccion,
    sugerenciaDeProduccion,
    type OrdenParaReporte,
    type ProductoParaProducir,
} from '../../src/production/index.js';

/** Espejo en el escritorio: `ReportesDeProduccionTests.cs`, mismos casos y mismos números. */

const HARINA = '11111111-1111-4111-8111-111111111111';
const MANTEQUILLA = '22222222-2222-4222-8222-222222222222';
const BOLILLO = '33333333-3333-4333-8333-333333333333';
const CONCHA = '44444444-4444-4444-8444-444444444444';
const OBRADOR = '55555555-5555-4555-8555-555555555555';

function orden(p: Partial<OrdenParaReporte> & Pick<OrdenParaReporte, 'id' | 'productId' | 'lines'>): OrdenParaReporte {
    return {
        orderNumber: p.id,
        productName: p.productId === BOLILLO ? 'Bolillo' : 'Concha',
        warehouseId: OBRADOR,
        status: 'COMPLETED',
        plannedQuantity: 100,
        producedQuantity: 100,
        totalCost: 0,
        unitCost: 0,
        completedAt: '2026-11-10T12:00:00.000Z',
        ...p,
    };
}

// Bolillo: planeado 100, salió 80; la receta pedía 10 kg de harina y se usaron 9 a $13.
const o1 = orden({
    id: 'PROD-1',
    productId: BOLILLO,
    plannedQuantity: 100,
    producedQuantity: 80,
    totalCost: 117,
    unitCost: 1.4625,
    lines: [{ componentProductId: HARINA, componentName: 'Harina', plannedQuantity: 10, consumedQuantity: 9, unitCost: 13 }],
});
// Bolillo: salió lo planeado, con harina de más (11 contra 10).
const o2 = orden({
    id: 'PROD-2',
    productId: BOLILLO,
    completedAt: '2026-11-12T12:00:00.000Z',
    totalCost: 143,
    unitCost: 1.43,
    lines: [{ componentProductId: HARINA, componentName: 'Harina', plannedQuantity: 10, consumedQuantity: 11, unitCost: 13 }],
});
// Concha con mantequilla de más; y una orden abierta que los reportes no miran.
const o3 = orden({
    id: 'PROD-3',
    productId: CONCHA,
    plannedQuantity: 24,
    producedQuantity: 24,
    totalCost: 300,
    unitCost: 12.5,
    lines: [{ componentProductId: MANTEQUILLA, componentName: 'Mantequilla', plannedQuantity: 2, consumedQuantity: 2.5, unitCost: 120 }],
});
const abierta = orden({ id: 'PROD-4', productId: CONCHA, status: 'RELEASED', producedQuantity: 0, completedAt: null, lines: [{ componentProductId: MANTEQUILLA, componentName: 'Mantequilla', plannedQuantity: 9, consumedQuantity: 9, unitCost: 0 }] });

describe('consumo y costo estándar', () => {
    it('el planeado del insumo se escala a lo que salió', () => {
        expect(consumoEstandar(o1, o1.lines[0]!)).toBe(8);
    });
});

describe('costos de producción', () => {
    const r = costosDeProduccion([o1, o2, o3, abierta]);
    it('una fila por producto, solo terminadas, la más cara arriba', () => {
        expect(r.rows.map((x) => x.productName)).toEqual(['Concha', 'Bolillo']);
        const b = r.rows[1]!;
        expect(b.orders).toBe(2);
        expect(b.producedQuantity).toBe(180);
        expect(b.totalCost).toBe(260);
        expect(b.unitCost).toBe(1.4444);
        expect(b.minUnitCost).toBe(1.43);
        expect(b.maxUnitCost).toBe(1.4625);
        expect(b.lastUnitCost).toBe(1.43);
        // estándar: 8 kg × 13 + 10 kg × 13 = 234
        expect(b.standardCost).toBe(234);
        expect(b.variance).toBe(26);
    });
    it('los totales suman las filas', () => {
        expect(r.totals).toEqual({ orders: 3, totalCost: 560, standardCost: 474, variance: 86 });
    });
});

describe('rendimiento', () => {
    const r = rendimientoDeProduccion([o1, o2, o3, abierta], 95);
    it('lo que queda bajo la tolerancia va primero', () => {
        expect(r.rows[0]).toMatchObject({ orderNumber: 'PROD-1', yieldPercent: 80, belowTolerance: true });
        expect(r.rows.slice(1).every((x) => !x.belowTolerance)).toBe(true);
        expect(r.totals).toEqual({ orders: 3, belowTolerance: 1 });
    });
    it('por producto: rendimiento ponderado y el peor', () => {
        const b = r.byProduct.find((x) => x.productId === BOLILLO)!;
        expect(b).toMatchObject({ orders: 2, plannedQuantity: 200, producedQuantity: 180, yieldPercent: 90, worstYieldPercent: 80, belowTolerance: 1 });
    });
});

describe('merma de producción', () => {
    const r = mermaDeProduccion([o1, o2, o3, abierta], 5);
    it('consumido contra estándar, al costo, lo más caro arriba', () => {
        expect(r.rows[0]).toMatchObject({ componentName: 'Mantequilla', standardQuantity: 2, consumedQuantity: 2.5, difference: 0.5, differencePercent: 25, value: 60, overTolerance: true });
        // harina: estándar 8 + 10 = 18, consumida 20 → 2 kg, 11.1 %, $26
        expect(r.rows[1]).toMatchObject({ componentName: 'Harina', orders: 2, standardQuantity: 18, consumedQuantity: 20, difference: 2, differencePercent: 11.1, value: 26, overTolerance: true });
        expect(r.totals).toEqual({ value: 86, overTolerance: 2 });
    });
    it('el ahorro sale negativo y no se marca', () => {
        const ahorro = orden({ id: 'X', productId: BOLILLO, lines: [{ componentProductId: HARINA, componentName: 'Harina', plannedQuantity: 10, consumedQuantity: 9, unitCost: 10 }] });
        expect(mermaDeProduccion([ahorro], 5).rows[0]).toMatchObject({ difference: -1, differencePercent: -10, value: -10, overTolerance: false });
    });
});

describe('sugerencia de producción', () => {
    const base: ProductoParaProducir = { productId: BOLILLO, productName: 'Bolillo', existencia: 40, enProceso: 0, minimo: 60, puntoDeReorden: 120, maximo: 400, rinde: 60, costoUnitarioEstimado: 1.35 };
    it('bajo el reorden, hasta el máximo, redondeado hacia arriba al lote', () => {
        expect(sugerenciaDeProduccion(base)).toBe(360);
        expect(sugerenciaDeProduccion({ ...base, productName: 'Concha', existencia: 12, enProceso: 48, puntoDeReorden: 60, maximo: 150, rinde: 24 })).toBe(96);
    });
    it('lo que está en proceso cuenta', () => {
        expect(sugerenciaDeProduccion({ ...base, enProceso: 100 })).toBe(0);
    });
    it('sin máximo, hasta el doble del umbral; sin reorden manda el mínimo', () => {
        expect(sugerenciaDeProduccion({ ...base, existencia: 2, minimo: 0, puntoDeReorden: 4, maximo: 0, rinde: 1 })).toBe(6);
        expect(sugerenciaDeProduccion({ ...base, existencia: 10, puntoDeReorden: 0, minimo: 20, maximo: 0, rinde: 1 })).toBe(30);
    });
    it('sin nivel no se sugiere', () => {
        expect(sugerenciaDeProduccion({ ...base, existencia: 0, minimo: 0, puntoDeReorden: 0 })).toBe(0);
    });
    it('la cuenta se explica', () => {
        expect(explicarSugerencia({ ...base, existencia: 12, enProceso: 48, puntoDeReorden: 60, maximo: 150, rinde: 24 })).toBe(
            'Hay 12 y 48 en proceso: 60, que no pasa del punto de reorden (60). Se repone hasta el máximo: 150 − 60 = 90, redondeado hacia arriba al lote de 24 → 96 (4 lotes).',
        );
    });
});

describe('producción del día', () => {
    const hoy = '2026-11-13T06:00:00.000Z';
    const terminadaHoy = orden({ id: 'PROD-9', productId: BOLILLO, completedAt: '2026-11-13T12:40:00.000Z', totalCost: 405, unitCost: 1.35, lines: [] });
    const r = produccionDelDia({
        warehouseId: OBRADOR,
        sugiere: true,
        productos: [
            { productId: BOLILLO, productName: 'Bolillo', existencia: 40, minimo: 60, puntoDeReorden: 120, maximo: 400, rinde: 60, costoUnitarioEstimado: 1.35 },
            { productId: CONCHA, productName: 'Concha', existencia: 12, minimo: 24, puntoDeReorden: 60, maximo: 150, rinde: 24, costoUnitarioEstimado: 4.3 },
        ],
        ordenes: [o1, abierta, terminadaHoy],
        existencia: (id) => (id === MANTEQUILLA ? 6.5 : 0),
        terminadasDesde: hoy,
    });
    it('sugiere con lo que está en proceso de la bodega', () => {
        // Concha: 12 + 100 en proceso (la orden abierta planea 100) pasa de 60 → no se sugiere.
        expect(r.sugerencias.map((s) => [s.productName, s.cantidad, s.lotes, s.costoEstimado])).toEqual([['Bolillo', 360, 6, 486]]);
    });
    it('insumos, en proceso y terminado hoy', () => {
        expect(r.insumos).toEqual([{ componentProductId: MANTEQUILLA, componentName: 'Mantequilla', piden: 9, hay: 6.5, faltan: 2.5 }]);
        expect(r.enProceso.map((o) => o.orderNumber)).toEqual(['PROD-4']);
        expect(r.terminadas.map((o) => o.orderNumber)).toEqual(['PROD-9']);
        expect(r.totales).toEqual({ porProducir: 1, costoPorProducir: 486, insumosQueFaltan: 1, terminadasHoy: 1, costoTerminadoHoy: 405 });
    });
    it('apagada, no sugiere', () => {
        const apagada = produccionDelDia({ warehouseId: OBRADOR, sugiere: false, productos: [], ordenes: [], existencia: () => 0, terminadasDesde: hoy });
        expect(apagada.sugiere).toBe(false);
        expect(apagada.sugerencias).toEqual([]);
    });
});

describe('periodo local', () => {
    it('del 1 al 13 en México (UTC−6) es [1 06:00Z, 14 06:00Z)', () => {
        const { desde, hasta } = intervaloDelPeriodo({ from: '2026-11-01', to: '2026-11-13', tz: 360 });
        expect(desde.toISOString()).toBe('2026-11-01T06:00:00.000Z');
        expect(hasta.toISOString()).toBe('2026-11-14T06:00:00.000Z');
    });
});

describe('configuración de Producción como claves', () => {
    it('sin claves rige todo por omisión', () => {
        expect(deClavesDeProduccion({})).toEqual(PRODUCTION_SETTINGS_DEFAULT);
        expect(PRODUCTION_SETTINGS_DEFAULT.tolerances).toEqual({ minYieldPercent: 95, maxOverconsumptionPercent: 5 });
        expect(PRODUCTION_SETTINGS_DEFAULT.orders.requireRelease).toBe(false);
        expect(PRODUCTION_SETTINGS_DEFAULT.daily.suggestFromStockLevels).toBe(true);
    });
    it('ida y vuelta, y una clave rota no tira el documento', () => {
        const doc = { ...PRODUCTION_SETTINGS_DEFAULT, orders: { defaultWarehouseId: OBRADOR, requireRelease: true } };
        const claves = aClavesDeProduccion(doc);
        expect(claves['production.orders.requireRelease']).toBe('true');
        expect(claves['production.orders.defaultWarehouseId']).toBe(JSON.stringify(OBRADOR));
        expect(deClavesDeProduccion(claves)).toEqual(doc);
        expect(deClavesDeProduccion({ ...claves, 'production.tolerances.minYieldPercent': '"no"' }).tolerances.minYieldPercent).toBe(95);
    });
});
