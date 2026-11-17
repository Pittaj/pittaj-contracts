import { describe, expect, it } from 'vitest';
import { saldoDeLaNota } from '../../src/credit-note/redemptions';

describe('C4 · saldo de la nota de crédito derivado de sus usos', () => {
    it('importe menos lo usado, nunca negativo', () => {
        expect(saldoDeLaNota(500, [])).toBe(500);
        expect(saldoDeLaNota(500, [{ amount: 150 }])).toBe(350);
        expect(saldoDeLaNota(500, [{ amount: 300 }, { amount: 300 }])).toBe(0);
    });
});
