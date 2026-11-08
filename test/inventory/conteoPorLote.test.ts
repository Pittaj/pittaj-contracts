/** (2.82.0) El conteo por lote. Mismos vectores que `ConteoPorLoteTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import { conteoPorLote } from '../../src/inventory/index.js';

const saldos = [
    { lotId: 'a', lotNumber: 'A', onHand: 10 },
    { lotId: 'b', lotNumber: 'B', onHand: 5 },
];

describe('conteoPorLote', () => {
    it('cada lote queda en lo contado: uno sale, otro entra, y el total cuadra sin mover nada sin lote', () => {
        // Teórico 15, contado 15 (A 7, B 8): la diferencia es 0 pero los lotes se acomodan.
        expect(conteoPorLote([{ lotId: 'a', lotNumber: 'A', quantity: 7 }, { lotId: 'b', lotNumber: 'B', quantity: 8 }], saldos, 0)).toEqual({
            sale: [{ lotId: 'a', lotNumber: 'A', quantity: 3 }],
            entra: [{ lotId: 'b', lotNumber: 'B', quantity: 3 }],
            saleSinLote: 0,
            entraSinLote: 0,
        });
    });

    it('un lote con saldo que no se contó no se encontró, y uno nuevo entra', () => {
        // Teórico 15, contado 12 (solo C, que no estaba): A y B salen enteros, C entra.
        expect(conteoPorLote([{ lotId: 'c', lotNumber: 'C', quantity: 12 }], saldos, -3)).toEqual({
            sale: [
                { lotId: 'a', lotNumber: 'A', quantity: 10 },
                { lotId: 'b', lotNumber: 'B', quantity: 5 },
            ],
            entra: [{ lotId: 'c', lotNumber: 'C', quantity: 12 }],
            saleSinLote: 0,
            entraSinLote: 0,
        });
    });

    it('lo que no cuadra con la diferencia del renglón va sin lote', () => {
        // Teórico 18 (3 sin lote), contado 16: A 10, B 5 y 1 sin lote → la existencia sin lote baja 2.
        expect(conteoPorLote([{ lotId: 'a', lotNumber: 'A', quantity: 10 }, { lotId: 'b', lotNumber: 'B', quantity: 5 }], saldos, -2)).toEqual({
            sale: [],
            entra: [],
            saleSinLote: 2,
            entraSinLote: 0,
        });
        expect(conteoPorLote([{ lotId: 'a', lotNumber: 'A', quantity: 10 }], saldos, 1).entraSinLote).toBe(6);
    });
});
