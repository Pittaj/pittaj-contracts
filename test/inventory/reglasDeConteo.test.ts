/**
 * I6a · Conteo por alcance, ciego y con escáner. Los mismos vectores que `ReglasDeConteoTests` del
 * escritorio: si las dos puntas precargan o suman distinto, el conteo deja de valer en las dos.
 */
import { describe, expect, it } from 'vitest';
import {
    bloqueoDeConteoCiego,
    piezasDeLectura,
    renglonesDelAlcance,
    seVeElTeorico,
    sumarLectura,
    type CandidatoDeConteo,
} from '../../src/inventory/index.js';

const c = (productId: string, productName: string, existencia: number, categoryId: string | null = null, tieneNivel = false): CandidatoDeConteo =>
    ({ productId, productName, productCode: null, categoryId, existencia, tieneNivel });

const candidatos = [
    c('p3', 'Ñame', 4, 'verdura'),
    c('p1', 'azúcar', 0, 'abarrotes', true),
    c('p2', 'Arroz', -2, 'abarrotes'),
    c('p4', 'Cebolla', 0, 'verdura'),
    c('p5', 'Nopal', 0, null),
    c('p0', 'Arroz', 3, 'abarrotes'),
];

describe('renglones del alcance', () => {
    it('toda la bodega: con existencia (aunque sea negativa) o con nivel, en orden de nombre', () => {
        expect(renglonesDelAlcance('FULL', candidatos).map((x) => x.productId)).toEqual(['p0', 'p2', 'p1', 'p3']);
    });

    it('por categoría: todo lo de la categoría, aunque esté en cero', () => {
        expect(renglonesDelAlcance('CATEGORY', candidatos, ['verdura']).map((x) => x.productId)).toEqual(['p4', 'p3']);
        expect(renglonesDelAlcance('CATEGORY', candidatos, [])).toEqual([]);
    });

    it('parcial y cíclico no precargan', () => {
        expect(renglonesDelAlcance('PARTIAL', candidatos)).toEqual([]);
        expect(renglonesDelAlcance('CYCLIC', candidatos)).toEqual([]);
    });
});

describe('lecturas del escáner', () => {
    it('una caja suma su factor; sin factor, una pieza', () => {
        expect(piezasDeLectura(1, 12)).toBe(12);
        expect(piezasDeLectura(2, null)).toBe(2);
        expect(piezasDeLectura(1, 0.3333)).toBe(0.3333);
    });

    it('suma sobre lo contado; un negativo corrige sin bajar de cero', () => {
        expect(sumarLectura(null, 1)).toBe(1);
        expect(sumarLectura(5, 12)).toBe(17);
        expect(sumarLectura(5, -1)).toBe(4);
        expect(sumarLectura(1, -3)).toBe(0);
        expect(sumarLectura(null, -1)).toBeNull();
        expect(sumarLectura(0.1, 0.2)).toBe(0.3);
    });
});

describe('ciego', () => {
    it('no se ve el teórico mientras se captura; sí al cerrar la captura o al aplicar', () => {
        expect(seVeElTeorico({ blind: true, status: 'DRAFT', captureClosedAt: null })).toBe(false);
        expect(seVeElTeorico({ blind: true, status: 'DRAFT', captureClosedAt: '2026-11-01T10:00:00Z' })).toBe(true);
        expect(seVeElTeorico({ blind: true, status: 'APPLIED' })).toBe(true);
        expect(seVeElTeorico({ blind: false, status: 'DRAFT' })).toBe(true);
    });

    it('uno ciego no se aplica sin cerrar la captura', () => {
        expect(bloqueoDeConteoCiego({ blind: true, captureClosedAt: null })).toContain('cierra la captura');
        expect(bloqueoDeConteoCiego({ blind: true, captureClosedAt: '2026-11-01T10:00:00Z' })).toBeNull();
        expect(bloqueoDeConteoCiego({ blind: false })).toBeNull();
    });
});
