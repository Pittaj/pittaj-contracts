import { describe, expect, it } from 'vitest';
import { saldoDeLaNota, sobregiroDeLaNota } from '../../src/credit-note/redemptions';

describe('C4 · saldo de la nota de crédito derivado de sus usos', () => {
    it('importe menos lo usado, nunca negativo', () => {
        expect(saldoDeLaNota(500, [])).toBe(500);
        expect(saldoDeLaNota(500, [{ amount: 150 }])).toBe(350);
        expect(saldoDeLaNota(500, [{ amount: 300 }, { amount: 300 }])).toBe(0);
    });
});

describe('2.114.0 · sobregiro de la nota', () => {
    it('cero mientras los usos no pasen el importe', () => {
        expect(sobregiroDeLaNota(100, [{ amount: 60 }, { amount: 40 }])).toBe(0);
    });
    it('lo que los usos pasan del importe (dos cajas a la vez)', () => {
        expect(sobregiroDeLaNota(100, [{ amount: 80 }, { amount: 70.5 }])).toBe(50.5);
    });
});
