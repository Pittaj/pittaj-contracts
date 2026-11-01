/** I8a · Lotes. Los mismos vectores que `ReglasDeLotesTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import {
    asignarLotes,
    diasACaducar,
    estadoVisibleDeLote,
    normalizarNumeroDeLote,
    numeroDeLoteAutomatico,
    semillaDeLote,
    semillaDeMovimientoDeLote,
    type LoteConSaldo,
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

describe('identidad y fechas', () => {
    it('el número se compara sin espacios y en mayúsculas; la semilla lo usa', () => {
        expect(normalizarNumeroDeLote(' l2409 ')).toBe('L2409');
        expect(semillaDeLote('p1', ' l2409 ')).toBe('stock:lot:p1:L2409');
        expect(semillaDeMovimientoDeLote('stock:t1:l1', 'lot-1')).toBe('stock:t1:l1:lot:lot-1');
    });

    it('días a caducar y estado visible', () => {
        expect([diasACaducar('2026-11-11', HOY), diasACaducar('2026-11-01', HOY), diasACaducar('2026-10-31T00:00:00.000Z', HOY), diasACaducar(null, HOY)]).toEqual([10, 0, -1, null]);
        expect(estadoVisibleDeLote('AVAILABLE', '2026-10-31', HOY)).toBe('EXPIRED');
        expect(estadoVisibleDeLote('AVAILABLE', '2026-11-01', HOY)).toBe('AVAILABLE');
        expect(estadoVisibleDeLote('QUARANTINE', '2026-10-01', HOY)).toBe('QUARANTINE');
    });

    it('número automático', () => {
        expect(numeroDeLoteAutomatico('L{AAMMDD}-{n}', HOY, 3)).toBe('L261101-3');
        expect(numeroDeLoteAutomatico('{AAAA}/{MM}/{DD}#{n}', HOY, 12)).toBe('2026/11/01#12');
        expect(numeroDeLoteAutomatico('', HOY, 1)).toBe('L261101-1');
    });
});

describe('qué lote sale', () => {
    const lotes = [
        l('a', 5, '2026-12-01', '2026-09-01T10:00:00.000Z'),
        l('b', 3, '2026-11-15', '2026-10-01T10:00:00.000Z'),
        l('c', 10, null, '2026-08-01T10:00:00.000Z'),
        l('d', 4, '2026-10-20', '2026-07-01T10:00:00.000Z'),
        l('e', 9, '2026-11-10', '2026-06-01T10:00:00.000Z', 'QUARANTINE'),
        l('f', 0, '2026-11-05', '2026-05-01T10:00:00.000Z'),
    ];

    it('FEFO: el que caduca primero; sin caducidad al final; ni caducados ni en cuarentena ni vacíos', () => {
        expect(asignarLotes(10, lotes, 'FEFO', HOY)).toEqual({
            asignados: [
                { lotId: 'b', lotNumber: 'B', quantity: 3 },
                { lotId: 'a', lotNumber: 'A', quantity: 5 },
                { lotId: 'c', lotNumber: 'C', quantity: 2 },
            ],
            sinLote: 0,
        });
    });

    it('FIFO: el que entró primero', () => {
        expect(asignarLotes(12, lotes, 'FIFO', HOY).asignados.map((x) => [x.lotId, x.quantity])).toEqual([
            ['c', 10],
            ['a', 2],
        ]);
    });

    it('lo que no alcanza sale sin lote; MANUAL no toma ninguno; la vida útil mínima excluye', () => {
        expect(asignarLotes(20, lotes, 'FEFO', HOY).sinLote).toBe(2);
        expect(asignarLotes(4, lotes, 'MANUAL', HOY)).toEqual({ asignados: [], sinLote: 4 });
        expect(asignarLotes(4, lotes, 'FEFO', HOY, 20).asignados.map((x) => x.lotId)).toEqual(['a']);
        expect(asignarLotes(0, lotes, 'FEFO', HOY)).toEqual({ asignados: [], sinLote: 0 });
    });
});
