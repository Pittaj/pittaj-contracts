/** Reconteo y aprobación del conteo. Los mismos casos que `RevisionDeConteoTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import { bloqueoDeRevision, pideAprobacion, recontar, renglonesPorRecontar, valorDeLaDiferencia } from '../../src/inventory/index.js';

describe('reconteo', () => {
    const lineas = [
        { id: 'a', expectedQuantity: 10, countedQuantity: 10 },
        { id: 'b', expectedQuantity: 10, countedQuantity: 8 },
        { id: 'c', expectedQuantity: 5, countedQuantity: 6, firstCountedQuantity: 7 },
        { id: 'd', expectedQuantity: 5, countedQuantity: null },
        { id: 'e', expectedQuantity: 0.3, countedQuantity: 0.1 + 0.2 },
    ];

    it('por recontar: contados con diferencia y sin recontar', () => {
        expect(renglonesPorRecontar(lineas)).toEqual(['b']);
    });

    it('recontar guarda la primera cifra y no la pisa después', () => {
        expect(recontar({ countedQuantity: 8 }, 9)).toEqual({ countedQuantity: 9, firstCountedQuantity: 8 });
        expect(recontar({ countedQuantity: 9, firstCountedQuantity: 8 }, 10)).toEqual({ countedQuantity: 10, firstCountedQuantity: 8 });
    });
});

describe('aprobación', () => {
    it('el valor suma lo que falta y lo que sobra', () => {
        expect(valorDeLaDiferencia([{ diferencia: -2, costo: 18.5 }, { diferencia: 1, costo: 40 }, { diferencia: 0, costo: 99 }])).toBe(77);
        expect(pideAprobacion(77, 0)).toBe(false);
        expect(pideAprobacion(77, 77)).toBe(true);
        expect(pideAprobacion(76.99, 77)).toBe(false);
    });

    it('primero el reconteo, después la aprobación', () => {
        const base = { requireRecountOnDiscrepancy: true, approvalThresholdValue: 1000, porRecontar: 2, valorDiferencia: 1500, aprobado: false };
        expect(bloqueoDeRevision(base)).toBe('Hay 2 renglones con diferencia por recontar antes de aplicar.');
        expect(bloqueoDeRevision({ ...base, porRecontar: 1 })).toBe('Hay un renglón con diferencia por recontar antes de aplicar.');
        expect(bloqueoDeRevision({ ...base, porRecontar: 0 })).toBe(
            'La diferencia vale $1,500.00 y el umbral es $1,000.00: necesita aprobación antes de aplicar.'
        );
        expect(bloqueoDeRevision({ ...base, porRecontar: 0, aprobado: true })).toBeNull();
        expect(bloqueoDeRevision({ ...base, requireRecountOnDiscrepancy: false, approvalThresholdValue: 0 })).toBeNull();
    });
});
