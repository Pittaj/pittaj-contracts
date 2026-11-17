import { describe, expect, it } from 'vitest';
import {
    MAX_VENTAS_ABIERTAS,
    estaInactiva,
    nombreDePestana,
    pestanaSiguiente,
    pestanasDelTurno,
    puedeAbrirOtra,
} from '../../src/pos-ticket/ventasEnPestanas';

describe('C1 · ventas en pestañas', () => {
    it('solo las vivas, en el orden en que se abrieron', () => {
        const r = pestanasDelTurno([
            { id: 'c', status: 'OPEN', createdAt: '2026-11-17T10:05:00Z' },
            { id: 'a', status: 'SUSPENDED', createdAt: '2026-11-17T10:00:00Z' },
            { id: 'x', status: 'COMPLETED', createdAt: '2026-11-17T09:00:00Z' },
            { id: 'b', status: 'OPEN', createdAt: '2026-11-17T10:00:00Z' },
        ]);
        expect(r.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    });

    it('F6 y Shift+F6 dan la vuelta', () => {
        const ids = ['a', 'b', 'c'];
        expect(pestanaSiguiente(ids, 'c', 1)).toBe('a');
        expect(pestanaSiguiente(ids, 'a', -1)).toBe('c');
        expect(pestanaSiguiente(ids, null, 1)).toBe('a');
        expect(pestanaSiguiente(ids, null, -1)).toBe('c');
        expect(pestanaSiguiente([], 'a', 1)).toBeNull();
    });

    it('tope de ocho', () => {
        expect(puedeAbrirOtra(MAX_VENTAS_ABIERTAS - 1)).toBe(true);
        expect(puedeAbrirOtra(MAX_VENTAS_ABIERTAS)).toBe(false);
    });

    it('marca la que lleva más de cinco minutos sin tocarse', () => {
        const ahora = new Date('2026-11-17T10:10:00Z');
        expect(estaInactiva('2026-11-17T10:04:00Z', ahora)).toBe(true);
        expect(estaInactiva('2026-11-17T10:06:00Z', ahora)).toBe(false);
        expect(estaInactiva(null, ahora)).toBe(false);
    });

    it('nombre: el cliente, o «Venta N»', () => {
        expect(nombreDePestana('Sra. López', 2)).toBe('Sra. López');
        expect(nombreDePestana('  ', 3)).toBe('Venta 3');
        expect(nombreDePestana(null, 1)).toBe('Venta 1');
    });
});
