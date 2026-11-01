/** I8b · El lote en los demás movimientos y la caducidad. Mismos vectores que `ReglasDeLotesI8bTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import {
    alertaDeCaducidad,
    asignarLotesInternos,
    preferenciaDeAjuste,
    seguirLotes,
    type LoteConSaldo,
    type LoteParaAlertas,
} from '../../src/inventory/index.js';

const HOY = '2026-11-01';
const l = (lotId: string, onHand: number, expiresAt: string | null, receivedAt: string, status: LoteConSaldo['status'] = 'AVAILABLE'): LoteConSaldo => ({
    lotId,
    lotNumber: lotId.toUpperCase(),
    onHand,
    status,
    expiresAt,
    receivedAt,
});

describe('salida interna', () => {
    const lotes = [
        l('a', 5, '2026-12-01', '2026-10-01'),
        l('b', 3, '2026-10-20', '2026-09-01'), // caducado
        l('c', 4, '2026-11-15', '2026-10-05', 'QUARANTINE'),
        l('d', 6, null, '2026-08-01'),
    ];

    it('prefiriendo vendibles: FEFO entre vendibles, luego los demás, FEFO', () => {
        const r = asignarLotesInternos(14, lotes, HOY);
        expect(r.asignados.map((x) => [x.lotId, x.quantity])).toEqual([
            ['a', 5],
            ['d', 6],
            ['b', 3],
        ]);
        expect(r.sinLote).toBe(0);
    });

    it('prefiriendo no vendibles: caducado y en cuarentena primero', () => {
        const r = asignarLotesInternos(8, lotes, HOY, 'NO_VENDIBLES');
        expect(r.asignados.map((x) => [x.lotId, x.quantity])).toEqual([
            ['b', 3],
            ['c', 4],
            ['a', 1],
        ]);
    });

    it('lo que no alcanza sale sin lote; cero no asigna', () => {
        expect(asignarLotesInternos(25, lotes, HOY).sinLote).toBe(7);
        expect(asignarLotesInternos(0, lotes, HOY)).toEqual({ asignados: [], sinLote: 0 });
    });

    it('el motivo decide la preferencia', () => {
        expect(preferenciaDeAjuste('EXPIRED')).toBe('NO_VENDIBLES');
        expect(preferenciaDeAjuste('DAMAGE')).toBe('NO_VENDIBLES');
        expect(preferenciaDeAjuste('SHRINKAGE')).toBe('NO_VENDIBLES');
        expect(preferenciaDeAjuste('THEFT')).toBe('VENDIBLES');
        expect(preferenciaDeAjuste('COUNT')).toBe('VENDIBLES');
    });
});

describe('seguir los lotes del original', () => {
    const origen = [
        { lotId: 'a', lotNumber: 'A', quantity: 2 },
        { lotId: 'b', lotNumber: 'B', quantity: 3 },
        { lotId: 'a', lotNumber: 'A', quantity: 1 },
    ];

    it('en su orden, juntando el mismo lote', () => {
        const r = seguirLotes(4, origen);
        expect(r.asignados.map((x) => [x.lotId, x.quantity])).toEqual([
            ['a', 3],
            ['b', 1],
        ]);
        expect(r.sinLote).toBe(0);
    });

    it('lo que excede va sin lote', () => {
        const r = seguirLotes(7.5, origen);
        expect(r.asignados.map((x) => x.quantity)).toEqual([3, 3]);
        expect(r.sinLote).toBe(1.5);
        expect(seguirLotes(2, []).sinLote).toBe(2);
    });
});

describe('alerta de caducidad', () => {
    const base: LoteParaAlertas = {
        lotId: 'lot-1',
        lotNumber: 'L2409',
        status: 'AVAILABLE',
        expiresAt: '2026-11-11',
        productId: 'p1',
        productName: 'Leche',
        productCode: null,
        warehouseId: 'w1',
        warehouseName: 'Piso',
        onHand: 4,
        averageCost: 20,
    };

    it('por caducar dentro de los días de aviso', () => {
        const a = alertaDeCaducidad(base, 30, HOY)!;
        expect(a.id).toBe('EXPIRING:lot-1:w1');
        expect(a.severity).toBe('MEDIUM');
        expect(a.daysToExpiry).toBe(10);
        expect(a.valueAtRisk).toBe(80);
        expect(a.changedAt).toBe('2026-10-12T00:00:00.000Z');
        expect(a.message).toBe('Leche, lote L2409: 4 en Piso, caduca en 10 días');
        expect(alertaDeCaducidad(base, 9, HOY)).toBeNull();
        expect(alertaDeCaducidad(base, 0, HOY)).toBeNull();
    });

    it('caducado: alta, con otro id, aunque esté en cuarentena', () => {
        const a = alertaDeCaducidad({ ...base, expiresAt: '2026-10-30', status: 'QUARANTINE' }, 0, HOY)!;
        expect(a.id).toBe('EXPIRED:lot-1:w1');
        expect(a.severity).toBe('HIGH');
        expect(a.daysToExpiry).toBe(-2);
        expect(a.changedAt).toBe('2026-10-31T00:00:00.000Z');
    });

    it('caduca hoy; sin saldo, sin fecha o retirado no avisa', () => {
        expect(alertaDeCaducidad({ ...base, expiresAt: HOY }, 30, HOY)!.message).toBe('Leche, lote L2409: 4 en Piso, caduca hoy');
        expect(alertaDeCaducidad({ ...base, onHand: 0 }, 30, HOY)).toBeNull();
        expect(alertaDeCaducidad({ ...base, expiresAt: null }, 30, HOY)).toBeNull();
        expect(alertaDeCaducidad({ ...base, status: 'RECALLED', expiresAt: '2026-10-01' }, 30, HOY)).toBeNull();
    });
});
