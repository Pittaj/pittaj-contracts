import { describe, expect, it } from 'vitest';
import { combinarDescuentos, porcentajeParaImporte, vistaPreviaDelDescuento } from '../../src/pos-ticket/descuentoAlTicket';

describe('C3 · descuento al ticket', () => {
    it('combina con el descuento del renglón', () => {
        expect(combinarDescuentos(0, 10)).toBe(10);
        expect(combinarDescuentos(10, 5)).toBe(14.5);
        expect(combinarDescuentos(100, 10)).toBe(100);
    });

    it('el importe se vuelve porcentaje', () => {
        expect(porcentajeParaImporte(187, 18.7)).toBe(10);
        expect(porcentajeParaImporte(187, 500)).toBe(100);
        expect(porcentajeParaImporte(0, 10)).toBe(0);
    });

    it('se reparte en proporción al importe', () => {
        const v = vistaPreviaDelDescuento(
            [
                { id: 'a', importe: 36 },
                { id: 'b', importe: 52.5 },
                { id: 'c', importe: 64 },
                { id: 'd', importe: 34.5 },
            ],
            10,
        );
        expect(v.renglones.map((r) => r.descuento)).toEqual([3.6, 5.25, 6.4, 3.45]);
        expect(v.descuento).toBe(18.7);
        expect(v.totalDespues).toBe(168.3);
    });
});
