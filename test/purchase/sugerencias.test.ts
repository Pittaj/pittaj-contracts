/**
 * Desvío E · E2 y E3. Los mismos vectores viven en el escritorio (`SugerenciasTests.cs`).
 */
import { describe, expect, it } from 'vitest';
import {
    conceptoSugeridoPorClave,
    esClaveDeServicio,
    naturalezaSugerida,
    tipoDeActivoSugerido,
} from '../../src/purchase/sugerencias.js';
import { SEED_EXPENSE_CONCEPTS } from '../../src/expense-concept/semilla.js';

describe('conceptoSugeridoPorClave', () => {
    it.each([
        // La factura real de Mercado Lending (2026-08): intereses con 84101700.
        ['84101700', 'Intereses de Crédito AGOSTO del 2026', 'LOAN_INTEREST'],
        ['84121500', 'Comisión por transferencia', 'BANK_FEES'],
        ['84121500', 'Intereses moratorios', 'LOAN_INTEREST'],
        ['84131500', 'Póliza de seguro del local', 'INSURANCE'],
        ['81112100', 'Hosting', 'CLOUD_SOFTWARE'],
        ['83111603', 'Servicio de internet', 'PHONE_INTERNET'],
        ['83101800', 'Suministro de energía eléctrica', 'ELECTRICITY'],
        ['83101500', 'Servicio de agua potable', 'WATER'],
        ['78102203', 'Envío de paquete', 'FREIGHT'],
        ['82101500', 'Anuncio en espectacular', 'ADVERTISING'],
        ['72101500', 'Reparación de cortina', 'MAINTENANCE'],
        ['76111500', 'Limpieza de oficinas', 'CLEANING'],
        ['92121500', 'Vigilancia', 'SECURITY'],
        ['84111500', 'Servicios contables', 'FEES'],
        ['80131500', 'Arrendamiento de local', 'RENT'],
        ['15111510', 'Gas LP', 'GAS'],
        ['15101514', 'Gasolina Magna', 'FUEL'],
        ['15101500', 'Gas L.P. a granel', 'GAS'],
        ['44121600', 'Plumas y lápices', 'STATIONERY'],
    ])('%s «%s» → %s', (clave, desc, esperado) => {
        expect(conceptoSugeridoPorClave(clave, desc)).toBe(esperado);
    });

    it('la genérica y las claves que no dicen nada no sugieren', () => {
        expect(conceptoSugeridoPorClave('01010101', 'Intereses')).toBeNull();
        expect(conceptoSugeridoPorClave('50131700', 'Leche entera')).toBeNull();
        expect(conceptoSugeridoPorClave(null, 'Renta')).toBeNull();
    });

    it('todo lo sugerido existe en la semilla', () => {
        const codigos = new Set(SEED_EXPENSE_CONCEPTS.map((c) => c.code));
        for (const [clave, desc] of [['84101700', 'interés'], ['84121500', 'x'], ['15111510', 'gas'], ['53101900', 'uniforme']]) {
            const s = conceptoSugeridoPorClave(clave, desc);
            if (s) expect(codigos.has(s), s).toBe(true);
        }
    });
});

describe('naturalezaSugerida — el verbo principal del comprobante', () => {
    const c = (claveProdServ: string, descripcion: string, base = 100) => ({ claveProdServ, descripcion, base });

    it('Mercado Lending es gasto', () => {
        expect(naturalezaSugerida([c('84101700', 'Intereses de Crédito AGOSTO del 2026', 1344.78)])).toBe('GASTO');
    });
    it('abarrotes es compra', () => {
        expect(naturalezaSugerida([c('50131700', 'Leche entera'), c('50181900', 'Pan de caja')])).toBe('COMPRA');
    });
    it('un horno de 38 000 es activo', () => {
        expect(naturalezaSugerida([c('48101500', 'Horno de convección', 38000)])).toBe('ACTIVO');
    });
    it('la genérica no se adivina: compra', () => {
        expect(naturalezaSugerida([c('01010101', 'Varios')])).toBe('COMPRA');
        expect(naturalezaSugerida([])).toBe('COMPRA');
    });
    it('servicio mezclado con mercancía: compra', () => {
        expect(naturalezaSugerida([c('78102203', 'Flete'), c('50131700', 'Leche')])).toBe('COMPRA');
    });
    it('esClaveDeServicio', () => {
        expect(esClaveDeServicio('84101700')).toBe(true);
        expect(esClaveDeServicio('50131700')).toBe(false);
        expect(esClaveDeServicio('95121600')).toBe(false);
    });
});

describe('tipoDeActivoSugerido (E3)', () => {
    it.each([
        ['43211503', 'Laptop', 'COMPUTER'],
        ['25101503', 'Camioneta', 'VEHICLE'],
        ['56101500', 'Escritorio', 'STORE_EQUIPMENT'],
        ['48101500', 'Horno de convección', 'MACHINERY'],
        ['24131600', 'Cámara de refrigeración', 'MACHINERY'],
        ['72151500', 'Instalación eléctrica del local', 'LEASEHOLD_IMPROVEMENT'],
        ['01010101', 'Refrigerador vertical dos puertas', 'STORE_EQUIPMENT'],
        ['01010101', 'Computadora de escritorio', 'COMPUTER'],
    ])('%s «%s» → %s', (clave, desc, esperado) => {
        expect(tipoDeActivoSugerido(clave, desc)).toBe(esperado);
    });
    it('sin pistas: null', () => {
        expect(tipoDeActivoSugerido('01010101', 'Varios')).toBeNull();
    });
});
