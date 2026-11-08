/** I10a · Etiquetas. Los mismos vectores que `ReglasDeEtiquetasTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import {
    CODE128_ANCHOS,
    textoDeCampo,
    barrasCode128,
    barrasDe,
    barrasEan13,
    digitoEan13,
    disenoDeEtiqueta,
    expandirEtiquetas,
    formatoDePrecio,
    posicionesEnHoja,
    precioDeEtiqueta,
    rejillaDe,
    simbolosCode128,
    validarPlantilla,
    validarTrabajo,
    type DatosDeEtiqueta,
    type PlantillaDeHoja,
} from '../../src/inventory/index.js';

const avery: PlantillaDeHoja = { widthMm: 66.68, heightMm: 25.4, columns: 3, rows: 10, output: 'PDF_SHEET', pageSize: 'LETTER', marginTopMm: 12.7, marginLeftMm: 4.76, gapXMm: 3.18, gapYMm: 0 };
const datos = (p: Partial<DatosDeEtiqueta> = {}): DatosDeEtiqueta => ({
    name: 'Refresco de cola 600 ml retornable edición especial', code: 'P-1', barcode: '750103131130', price: 18.5, priceWholesale: null, currency: 'MXN',
    unitName: null, categoryName: null, lotNumber: 'L-7', expiresAt: '2027-03-01', variant: null, serialNumber: null, companyName: null, ...p,
});

describe('barras', () => {
    it('cada símbolo de Code 128 mide 11 módulos (el alto, 13)', () => {
        expect(CODE128_ANCHOS).toHaveLength(107);
        CODE128_ANCHOS.forEach((a, i) => expect([...a].reduce((s, x) => s + Number(x), 0)).toBe(i === 106 ? 13 : 11));
    });
    it('juego B para texto, C de a pares para números (el non, en B)', () => {
        expect(simbolosCode128('Wikipedia')).toEqual([104, 55, 73, 75, 73, 80, 69, 68, 73, 65]);
        expect(simbolosCode128('12345')).toEqual([105, 12, 34, 100, 21]);
        expect(simbolosCode128('Año')).toBeNull();
        expect(barrasCode128('AB-1')).toBe('1101001000010100011000100010110001001101110010011100110100100110001100011101011');
    });
    it('EAN-13 con su verificador; uno inválido cae a Code 128', () => {
        expect(digitoEan13('750103131130')).toBe(9);
        expect(barrasEan13('5901234123457')).toBe('10100010110100111011001100100110111101001110101010110011011011001000010101110010011101000100101');
        expect(barrasEan13('5901234123458')).toBeNull();
        expect(barrasDe('EAN13', '750103131130')?.valor).toBe('7501031311309');
        expect(barrasDe('EAN13', 'P-1')?.simbologia).toBe('CODE128');
        expect(barrasDe('QR', 'P-1')?.simbologia).toBe('CODE128');
        expect(barrasDe('CODE128', '  ')).toBeNull();
    });
});

describe('precio', () => {
    it('al público: suma lo que no viene incluido, en cascada', () => {
        expect(precioDeEtiqueta(100, [{ rate: 0.08, isIncluded: false }, { rate: 0.16, isIncluded: false }])).toBe(125.28);
        expect(precioDeEtiqueta(99.99, [{ rate: 0.16, isIncluded: true }])).toBe(99.99);
        expect(formatoDePrecio(1234.5)).toBe('$1,234.50');
        expect(formatoDePrecio(0.005)).toBe('$0.01');
        expect(formatoDePrecio(1234567.891, 'USD')).toBe('$1,234,567.89 USD');
    });
});

describe('hoja', () => {
    it('rejilla con márgenes, y centrada si no los trae', () => {
        expect(rejillaDe(avery)).toEqual({ paginaAnchoMm: 215.9, paginaAltoMm: 279.4, x0Mm: 4.76, y0Mm: 12.7, pasoXMm: 69.86, pasoYMm: 25.4, columnas: 3, filas: 10, porHoja: 30 });
        expect(posicionesEnHoja({ ...avery, marginTopMm: null, marginLeftMm: null }, 3, 29)).toEqual([
            { pagina: 0, columna: 2, fila: 9, xMm: 144.47, yMm: 241.3 },
            { pagina: 1, columna: 0, fila: 0, xMm: 4.75, yMm: 12.7 },
            { pagina: 1, columna: 1, fila: 0, xMm: 74.61, yMm: 12.7 },
        ]);
        expect(validarPlantilla({ ...avery, widthMm: 80, marginLeftMm: null, marginTopMm: null, gapXMm: 0 })).toBe('No caben 3 columnas de 80 mm en una hoja Carta.');
        expect(validarPlantilla(avery)).toBeNull();
    });
    it('en térmica la página es la etiqueta y no se salta nada', () => {
        const t: PlantillaDeHoja = { ...avery, output: 'ZPL', widthMm: 50, heightMm: 25 };
        expect(rejillaDe(t).porHoja).toBe(1);
        expect(posicionesEnHoja(t, 2, 5).map((p) => p.pagina)).toEqual([0, 1]);
    });
});

describe('diseño', () => {
    it('textos en orden, el nombre cortado, el precio grande y las barras abajo', () => {
        const d = disenoDeEtiqueta({ widthMm: 66.68, heightMm: 25.4, fields: ['NAME', 'PRICE', 'LOT', 'BARCODE'], symbology: 'EAN13' }, datos());
        expect(d.map((e) => (e.tipo === 'barras' ? { ...e, modulos: e.modulos.length } : e))).toEqual([
            { tipo: 'texto', campo: 'NAME', texto: 'Refresco de cola 600 ml retornable edición espec…', xMm: 33.34, yMm: 1.5, altoMm: 3.21, tamanoPt: 6.6, negrita: true },
            { tipo: 'texto', campo: 'PRICE', texto: '$18.50', xMm: 33.34, yMm: 4.71, altoMm: 4.82, tamanoPt: 9.8, negrita: true },
            { tipo: 'texto', campo: 'LOT', texto: 'Lote L-7', xMm: 33.34, yMm: 9.53, altoMm: 2.41, tamanoPt: 4.9, negrita: false },
            { tipo: 'barras', simbologia: 'EAN13', valor: '7501031311309', modulos: 95, xMm: 7.04, yMm: 12.44, moduloMm: 0.5537, altoMm: 8.96, textoAltoMm: 2.5, textoPt: 5.1 },
        ]);
    });
    it('si no cabe, se quitan los campos del final', () => {
        const d = disenoDeEtiqueta({ widthMm: 30, heightMm: 12, fields: ['NAME', 'PRICE', 'CODE', 'LOT', 'BARCODE'], symbology: 'CODE128' }, datos({ name: 'Tornillo', code: 'T-9', barcode: null, price: 2, lotNumber: 'L1', expiresAt: null }));
        expect(d.map((e) => (e.tipo === 'texto' ? e.campo : `${e.simbologia}:${e.valor}`))).toEqual(['NAME', 'PRICE', 'CODE128:T-9']);
        expect(d[1]).toMatchObject({ yMm: 3.2, altoMm: 3.3, tamanoPt: 6.7 });
    });
});

describe('trabajo', () => {
    it('una etiqueta por serie, o sus copias; con tope', () => {
        const { serialNumber: _s, companyName: _c, ...base } = datos();
        const r = expandirEtiquetas([{ ...base, serialNumbers: ['A', 'B'], copies: 9 }, { ...base, serialNumbers: [], copies: 2 }], 'Mi tienda');
        expect(r.map((x) => x.serialNumber)).toEqual(['A', 'B', null, null]);
        expect(r[0]!.companyName).toBe('Mi tienda');
        expect(validarTrabajo([{ serialNumbers: [], copies: 0 }])).toBe('No hay etiquetas que imprimir.');
        expect(validarTrabajo([{ serialNumbers: [], copies: 5001 }])).toBe('Son 5001 etiquetas; el tope por impresión es 5000.');
    });
});

describe('ubicación en la etiqueta de anaquel (2.82.0)', () => {
    const base = {
        name: 'Arroz', code: 'ARR', barcode: null, price: 25, priceWholesale: null, currency: 'MXN', unitName: null, categoryName: null,
        lotNumber: null, expiresAt: null, variant: null, serialNumber: null, companyName: null,
    };
    it('con ubicación dice dónde va; sin ella, nada', () => {
        expect(textoDeCampo('LOCATION', { ...base, location: 'A-03-2' })).toBe('Ubic. A-03-2');
        expect(textoDeCampo('LOCATION', base)).toBe('');
    });
});
