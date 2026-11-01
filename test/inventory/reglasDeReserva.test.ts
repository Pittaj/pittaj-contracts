/**
 * I7 · Reservas. Los mismos vectores que `ReglasDeReservaTests` del escritorio.
 */
import { describe, expect, it } from 'vitest';
import {
    bloqueoDeReservaManual,
    disponibleDe,
    estadoVisibleDeReserva,
    pendienteDeReserva,
    reservadoDe,
    reservaVigente,
    type ReservaParaCalculo,
} from '../../src/inventory/index.js';

const AHORA = new Date('2026-11-01T12:00:00Z');
const r = (cambios: Partial<ReservaParaCalculo> = {}): ReservaParaCalculo => ({
    status: 'ACTIVE',
    quantity: 5,
    fulfilledQuantity: 0,
    expiresAt: null,
    ...cambios,
});

describe('reservas', () => {
    it('vigente: activa y sin vencer', () => {
        expect(reservaVigente(r(), AHORA)).toBe(true);
        expect(reservaVigente(r({ expiresAt: '2026-11-02T00:00:00Z' }), AHORA)).toBe(true);
        expect(reservaVigente(r({ expiresAt: '2026-11-01T12:00:00Z' }), AHORA)).toBe(false);
        expect(reservaVigente(r({ status: 'RELEASED' }), AHORA)).toBe(false);
        expect(reservaVigente(r({ status: 'FULFILLED' }), AHORA)).toBe(false);
    });

    it('compromete lo que le falta por salir, nunca negativo', () => {
        expect(pendienteDeReserva({ quantity: 5, fulfilledQuantity: 2 })).toBe(3);
        expect(pendienteDeReserva({ quantity: 5, fulfilledQuantity: 7 })).toBe(0);
        expect(pendienteDeReserva({ quantity: 0.3, fulfilledQuantity: 0.1 })).toBe(0.2);
    });

    it('reservado: la suma de lo pendiente de las vigentes', () => {
        const rs = [
            r({ quantity: 5, fulfilledQuantity: 2 }),
            r({ quantity: 4, expiresAt: '2026-10-31T00:00:00Z' }), // vencida: no cuenta
            r({ quantity: 10, status: 'RELEASED' }),
            r({ quantity: 1.5, expiresAt: '2026-12-01T00:00:00Z' }),
        ];
        expect(reservadoDe(rs, AHORA)).toBe(4.5);
        expect(reservadoDe([], AHORA)).toBe(0);
    });

    it('disponible: existencia menos reservado; cero en una bodega que no cuenta', () => {
        expect(disponibleDe(10, 4.5)).toBe(5.5);
        expect(disponibleDe(3, 5)).toBe(-2);
        expect(disponibleDe(10, 0, false)).toBe(0);
    });

    it('una activa vencida se lee «Vencida»', () => {
        expect(estadoVisibleDeReserva(r({ expiresAt: '2026-10-31T00:00:00Z' }), AHORA)).toBe('EXPIRED');
        expect(estadoVisibleDeReserva(r(), AHORA)).toBe('ACTIVE');
        expect(estadoVisibleDeReserva(r({ status: 'FULFILLED' }), AHORA)).toBe('FULFILLED');
    });

    it('la manual pide vencimiento futuro y no promete lo que no hay', () => {
        expect(bloqueoDeReservaManual({ quantity: 2, expiresAt: '2026-11-03T00:00:00Z' }, 5, AHORA)).toBeNull();
        expect(bloqueoDeReservaManual({ quantity: 2, expiresAt: '2026-11-01T00:00:00Z' }, 5, AHORA)).toContain('futuro');
        expect(bloqueoDeReservaManual({ quantity: 6, expiresAt: '2026-11-03T00:00:00Z' }, 5, AHORA)).toContain('Solo hay 5');
        expect(bloqueoDeReservaManual({ quantity: 0, expiresAt: '2026-11-03T00:00:00Z' }, 5, AHORA)).toContain('mayor que cero');
    });
});
