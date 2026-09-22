import { describe, expect, it } from 'vitest';
import { clasificarArchivoCfdi, evaluarDiferencia, type CfdiFileFacts } from '../../src/purchase/cfdiImport.js';

const base: CfdiFileFacts = {
    esCfdi: true, uuid: 'A1', repetidoEnLote: false, issuerRfc: 'BIM011112AB3', tenantRfc: 'HUE010101XYZ',
    tipoComprobante: 'I', yaEnBuzon: false, yaCapturado: false, issuerEfosStatus: '200', satEstado: 'Vigente',
    total: 9120.32, candidatas: [], tolerance: 1,
};
const oc = (n: string, total: number) => ({ purchaseId: `id-${n}`, purchaseNumber: n, total, date: '2026-09-21', version: 1 });

describe('clasificarArchivoCfdi — el paso 1 dice qué es cada archivo', () => {
    it('nuevo, vigente, sin candidatas', () => {
        const v = clasificarArchivoCfdi(base);
        expect(v.estado).toBe('NUEVO');
        expect(v.marcado).toBe(true);
        expect(v.candidata).toBeNull();
    });

    it('el orden de comprobación: no es CFDI > sin uuid > repetido > emitido por ti > ya capturado > tipo > cancelado', () => {
        expect(clasificarArchivoCfdi({ ...base, esCfdi: false }).estado).toBe('NO_ES_CFDI');
        expect(clasificarArchivoCfdi({ ...base, uuid: null }).estado).toBe('SIN_UUID');
        expect(clasificarArchivoCfdi({ ...base, repetidoEnLote: true }).estado).toBe('REPETIDO_EN_LOTE');
        expect(clasificarArchivoCfdi({ ...base, issuerRfc: 'HUE010101XYZ' }).estado).toBe('EMITIDO_POR_TI');
        expect(clasificarArchivoCfdi({ ...base, yaCapturado: true, yaEnBuzon: true }).estado).toBe('YA_CAPTURADO');
        expect(clasificarArchivoCfdi({ ...base, tipoComprobante: 'P' }).estado).toBe('COMPLEMENTO_DE_PAGO');
        expect(clasificarArchivoCfdi({ ...base, tipoComprobante: 'E' }).estado).toBe('NOTA_DE_CREDITO');
        expect(clasificarArchivoCfdi({ ...base, satEstado: 'Cancelado' }).estado).toBe('CANCELADO_SAT');
    });

    it('parece la compra: una candidata exacta se enlaza; con redondeo también, y lo dice', () => {
        const exacta = clasificarArchivoCfdi({ ...base, candidatas: [oc('OC-0312', 9120.32)] });
        expect(exacta.estado).toBe('PARECE_LA_COMPRA');
        expect(exacta.candidata?.diferencia).toBe(0);

        const redondeo = clasificarArchivoCfdi({ ...base, total: 50543, candidatas: [oc('OC-0298', 50543.32)] });
        expect(redondeo.estado).toBe('PARECE_LA_COMPRA');
        expect(redondeo.candidata?.diferencia).toBe(-0.32);
        expect(redondeo.motivo).toContain('redondeo');
    });

    it('dos candidatas que cuadran: no adivina; es NUEVO con la pista de elegir', () => {
        const v = clasificarArchivoCfdi({ ...base, candidatas: [oc('OC-0312', 9120.32), oc('OC-0313', 9120.32)] });
        expect(v.estado).toBe('NUEVO');
        expect(v.pistas.length).toBe(2);
        expect(v.motivo).toContain('OC-0312 o OC-0313');
    });

    it('una candidata que no cuadra es pista, no enlace', () => {
        const v = clasificarArchivoCfdi({ ...base, total: 9326.4, candidatas: [oc('OC-0312', 9120)] });
        expect(v.estado).toBe('NUEVO');
        expect(v.candidata).toBeNull();
        expect(v.motivo).toContain('¿es OC-0312? difiere $206.40');
    });

    it('ya estaba y 69-B se convierten; el 69-B no sale marcado', () => {
        expect(clasificarArchivoCfdi({ ...base, yaEnBuzon: true }).estado).toBe('YA_ESTABA');
        const efos = clasificarArchivoCfdi({ ...base, issuerEfosStatus: '100' });
        expect(efos.estado).toBe('EMISOR_69B');
        expect(efos.convertible).toBe(true);
        expect(efos.marcado).toBe(false);
    });
});

describe('evaluarDiferencia — cuadrar es exacto', () => {
    it('cero cuadra; centavos dentro de la tolerancia son redondeo; más es no cuadra', () => {
        expect(evaluarDiferencia(0, 1)).toBe('CUADRA');
        expect(evaluarDiferencia(-0.32, 1)).toBe('DIFERENCIA_DE_REDONDEO');
        expect(evaluarDiferencia(1, 1)).toBe('DIFERENCIA_DE_REDONDEO');
        expect(evaluarDiferencia(206.4, 1)).toBe('NO_CUADRA');
    });
});
