import { describe, expect, it } from 'vitest';
import { claveDeMesesCerrados, escribirMesesCerrados, fechaEnMesCerrado, leerMesesCerrados } from '../../src/inventory/index.js';

describe('meses cerrados en el canal de configuración (2.87.0)', () => {
    it('la clave lleva la empresa, bajo inventory. para que baje al escritorio', () => {
        expect(claveDeMesesCerrados('e1')).toBe('inventory.closedPeriods.e1');
    });

    it('escribe en orden y se lee igual', () => {
        const json = escribirMesesCerrados([
            { start: '2026-03-01', end: '2026-03-31' },
            { start: '2026-02-01', end: '2026-02-28' },
        ]);
        expect(json).toBe('[{"start":"2026-02-01","end":"2026-02-28"},{"start":"2026-03-01","end":"2026-03-31"}]');
        expect(leerMesesCerrados(json)).toHaveLength(2);
    });

    it('una fecha dentro de un mes cerrado, incluidos los extremos', () => {
        const meses = leerMesesCerrados('[{"start":"2026-03-01","end":"2026-03-31"}]');
        expect(fechaEnMesCerrado(meses, '2026-03-01')).toBe(true);
        expect(fechaEnMesCerrado(meses, '2026-03-31')).toBe(true);
        expect(fechaEnMesCerrado(meses, '2026-04-01')).toBe(false);
    });

    it('lo que no se entiende no cierra nada', () => {
        expect(leerMesesCerrados('no es json')).toEqual([]);
        expect(leerMesesCerrados('{"start":"2026-03-01"}')).toEqual([]);
        expect(leerMesesCerrados('[{"start":"marzo","end":"2026-03-31"}]')).toEqual([]);
        expect(leerMesesCerrados(null)).toEqual([]);
    });
});
