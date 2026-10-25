import { describe, expect, it } from 'vitest';
import {
    alertaDeConteo,
    alertaDeTraspaso,
    alertasDeExistencia,
    estaRevisada,
    INVENTORY_SETTINGS_DEFAULT,
    type ExistenciaParaAlertas,
} from '../../src/inventory/index.js';

/** Espejo en el escritorio: `AlertasDeInventarioTests.cs`, mismos casos y mismos números. */
const cfg = { ...INVENTORY_SETTINGS_DEFAULT.alerts, overstock: true };
const ahora = new Date('2026-10-25T12:00:00Z');
const pan = (o: Partial<ExistenciaParaAlertas>): ExistenciaParaAlertas => ({
    productId: 'pan',
    productName: 'Pan',
    productCode: 'P1',
    warehouseId: 'b1',
    warehouseName: 'Centro',
    onHand: 10,
    averageCost: 2,
    minStock: 5,
    reorderPoint: 8,
    maxStock: 40,
    lastMovementAt: '2026-10-24T12:00:00Z',
    ...o,
});
const tipos = (e: ExistenciaParaAlertas) => alertasDeExistencia(e, cfg, ahora).map((a) => `${a.kind}/${a.severity}`);

describe('alertasDeExistencia', () => {
    it('negativo es alta y no se acompaña de «bajo»', () => {
        const [a] = alertasDeExistencia(pan({ onHand: -3 }), cfg, ahora);
        expect(tipos(pan({ onHand: -3 }))).toEqual(['NEGATIVE/HIGH']);
        expect(a!.id).toBe('NEGATIVE:pan:b1');
        expect(a!.valueAtRisk).toBe(6);
    });
    it('en el reorden o bajo el mínimo es media; agotado con nivel, alta; sin nivel, nada', () => {
        expect(tipos(pan({ onHand: 8 }))).toEqual(['LOW_STOCK/MEDIUM']);
        expect(tipos(pan({ onHand: 9 }))).toEqual([]);
        expect(tipos(pan({ onHand: 0 }))).toEqual(['LOW_STOCK/HIGH']);
        expect(tipos(pan({ onHand: 0, minStock: 0, reorderPoint: 0, maxStock: 0 }))).toEqual([]);
        expect(alertasDeExistencia(pan({ onHand: 2 }), cfg, ahora)[0]).toMatchObject({ threshold: 5, valueAtRisk: 6 });
    });
    it('sobre el máximo, y sin movimiento desde hace N días aunque haya poco', () => {
        expect(tipos(pan({ onHand: 50 }))).toEqual(['OVERSTOCK/LOW']);
        expect(tipos(pan({ onHand: 50, lastMovementAt: '2026-07-01T00:00:00Z' }))).toEqual(['OVERSTOCK/LOW', 'NO_MOVEMENT/LOW']);
        const [sin] = alertasDeExistencia(pan({ lastMovementAt: '2026-07-27T12:00:00Z' }), cfg, ahora);
        expect(sin).toMatchObject({ kind: 'NO_MOVEMENT', daysWithoutMovement: 90 });
        expect(tipos(pan({ lastMovementAt: '2026-07-28T12:00:00Z' }))).toEqual([]);
    });
    it('lo apagado en la configuración no sale', () => {
        const apagado = { ...cfg, lowStock: false, negative: false, overstock: false, noMovementDays: 0 };
        for (const o of [{ onHand: -1 }, { onHand: 0 }, { onHand: 50, lastMovementAt: '2026-01-01T00:00:00Z' }]) {
            expect(alertasDeExistencia(pan(o), apagado, ahora)).toEqual([]);
        }
    });
});

describe('traspasos y conteos parados', () => {
    const t = {
        id: 't1',
        number: 'TS1-00001',
        toWarehouseId: 'b2',
        toWarehouseName: 'Norte',
        fromWarehouseName: 'Centro',
        updatedAt: '2026-10-22T12:00:00Z',
    };
    it('el traspaso avisa a los 3 días de enviado', () => {
        expect(alertaDeTraspaso({ ...t, sentAt: '2026-10-23T12:00:00Z' }, cfg, ahora)).toBeNull();
        expect(alertaDeTraspaso({ ...t, sentAt: '2026-10-22T12:00:00Z' }, cfg, ahora)).toMatchObject({
            id: 'TRANSFER_STALE:t1',
            severity: 'MEDIUM',
            daysWithoutMovement: 3,
            warehouseId: 'b2',
        });
    });
    it('el conteo avisa a los 7 días; con 0 nunca', () => {
        const c = {
            id: 'c1',
            number: 'AW-00002',
            warehouseId: 'b1',
            warehouseName: 'Centro',
            createdAt: '2026-10-18T12:00:00Z',
            updatedAt: '2026-10-18T12:00:00Z',
        };
        expect(alertaDeConteo(c, cfg, ahora)).toMatchObject({ id: 'COUNT_STALE:c1', severity: 'LOW', daysWithoutMovement: 7 });
        expect(alertaDeConteo(c, { ...cfg, countStaleDays: 0 }, ahora)).toBeNull();
    });
});

describe('estaRevisada', () => {
    const cambio = '2026-10-24T12:00:00Z';
    it('sin acuse no; con acuse posterior al cambio sí; si cambió después, vuelve', () => {
        expect(estaRevisada(null, cambio, ahora)).toBe(false);
        expect(estaRevisada({ acknowledgedAt: '2026-10-24T13:00:00Z', snoozeUntil: null }, cambio, ahora)).toBe(true);
        expect(estaRevisada({ acknowledgedAt: '2026-10-24T11:00:00Z', snoozeUntil: null }, cambio, ahora)).toBe(false);
    });
    it('pospuesta: hasta la fecha, aunque cambie', () => {
        expect(estaRevisada({ acknowledgedAt: '2026-10-01T00:00:00Z', snoozeUntil: '2026-10-26T00:00:00Z' }, cambio, ahora)).toBe(
            true,
        );
        expect(estaRevisada({ acknowledgedAt: '2026-10-25T00:00:00Z', snoozeUntil: '2026-10-25T06:00:00Z' }, cambio, ahora)).toBe(
            false,
        );
    });
});
