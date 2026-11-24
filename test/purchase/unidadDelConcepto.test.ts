import { describe, expect, it } from 'vitest';
import { unidadDelConcepto } from '../../src/purchase/index.js';

/** U-T2 · Espejo: `UnidadDelConceptoTests.cs` (escritorio), mismos casos. */
const huevoEnTapas = {
    unitOfMeasure: 'UNIT',
    satUnitCode: 'H87',
    units: [{ name: 'Kilo', factor: 0.5556 }, { name: 'Caja', factor: 12 }],
};

describe('unidad del concepto del CFDI', () => {
    it('la clave de la base entra en la base', () => {
        expect(unidadDelConcepto('KGM', { unitOfMeasure: 'KG', satUnitCode: 'KGM' })).toEqual({ unitName: null, unitFactor: 1, por: 'BASE' });
        expect(unidadDelConcepto('KGM', { unitOfMeasure: 'KG' }).por).toBe('BASE');
    });

    it('KGM con el inventario en tapas entra en «Kilo»', () => {
        expect(unidadDelConcepto('KGM', huevoEnTapas)).toEqual({ unitName: 'Kilo', unitFactor: 0.5556, por: 'NOMBRE' });
        expect(unidadDelConcepto('XBX', huevoEnTapas)).toEqual({ unitName: 'Caja', unitFactor: 12, por: 'NOMBRE' });
    });

    it('lo recordado para el proveedor manda', () => {
        expect(unidadDelConcepto('KGM', huevoEnTapas, 'Caja')).toEqual({ unitName: 'Caja', unitFactor: 12, por: 'RECORDADA' });
        expect(unidadDelConcepto('KGM', huevoEnTapas, null)).toEqual({ unitName: null, unitFactor: 1, por: 'RECORDADA' });
    });

    it('lo recordado que ya no está en la ficha se ignora', () => {
        expect(unidadDelConcepto('KGM', huevoEnTapas, 'Bulto').por).toBe('NOMBRE');
    });

    it('sin nada que lo diga, la base marcada para revisar', () => {
        expect(unidadDelConcepto('XLT', huevoEnTapas).por).toBe('SIN_DATO');
        expect(unidadDelConcepto(null, huevoEnTapas).por).toBe('SIN_DATO');
    });
});
