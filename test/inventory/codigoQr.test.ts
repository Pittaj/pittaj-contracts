/**
 * I10b · Código QR. Los mismos vectores que `CodigoQrTests` del escritorio. Que se LEA se comprobó
 * con un decodificador real (zxing) en las diez versiones y las ocho máscaras; aquí se fija la matriz.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { capacidadQr, codigoQr, correccionRs, disenoDeEtiqueta } from '../../src/inventory/index.js';

const huella = (filas: readonly string[]) => createHash('sha256').update(filas.join('\n')).digest('hex');

describe('codigoQr', () => {
    it('Reed-Solomon del ejemplo de la norma (versión 1-M, «01234567»)', () => {
        expect(correccionRs([16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17], 10)).toEqual([165, 36, 212, 193, 237, 54, 199, 135, 44, 85]);
    });
    it('capacidad en bytes con corrección M', () => {
        expect([1, 2, 5, 9, 10].map(capacidadQr)).toEqual([14, 26, 84, 180, 213]);
    });
    it('«HOLA»: versión 1, máscara 0, la matriz entera', () => {
        const q = codigoQr('HOLA')!;
        expect([q.version, q.mascara]).toEqual([1, 0]);
        expect(q.modulos).toEqual([
            '111111100101001111111',
            '100000101111101000001',
            '101110100010001011101',
            '101110100110101011101',
            '101110101111101011101',
            '100000100011001000001',
            '111111101010101111111',
            '000000000100000000000',
            '101010100100100010010',
            '011011010101010100110',
            '011111110111011101011',
            '100101000101110110010',
            '011001111011011100100',
            '000000001000001000110',
            '111111100010100010111',
            '100000100000001000010',
            '101110101110101010111',
            '101110100001010101010',
            '101110101101011101101',
            '100000100111110111010',
            '111111101111011100111',
        ]);
    });
    it('EAN, acentos y el más largo que cabe', () => {
        const ver = (t: string) => { const q = codigoQr(t)!; return [q.version, q.mascara, huella(q.modulos)]; };
        expect(ver('7501031311309')).toEqual([1, 2, "1f16aaae2c43640d07cccf2d4f9522b81af0dbe1ceb9aca4af0b63b47b88315a"]);
        expect(ver('Año ñandú €')).toEqual([2, 2, "1395531f4888485c611b5d053b8dc30d39673b8d0ef01fdf62b40db0e44d032a"]);
        expect(ver('z'.repeat(213))).toEqual([10, 1, "f6862dc828d614e511c1aea5f5a112d3daed5599ae635fd3e675eb5a0f04fc3a"]);
        expect(codigoQr('z'.repeat(214))).toBeNull();
    });
    it('en la etiqueta: cuadrado al pie, centrado, sin código legible', () => {
        const d = disenoDeEtiqueta({ widthMm: 50, heightMm: 25, fields: ['NAME', 'PRICE', 'BARCODE'], symbology: 'QR' }, {
            name: 'Refresco', code: 'R', barcode: '750103131130', price: 18.5, priceWholesale: null, currency: 'MXN', unitName: null, categoryName: null,
            lotNumber: null, expiresAt: null, variant: null, serialNumber: null, companyName: null,
        });
        const qr = d.find((e) => e.tipo === 'qr')!;
        expect(qr).toMatchObject({ tipo: 'qr', valor: '750103131130', xMm: 20.25, yMm: 13.1, moduloMm: 0.452 });
        expect(d.filter((e) => e.tipo === 'texto').map((e) => e.tipo === 'texto' && [e.campo, e.yMm, e.tamanoPt])).toEqual([['NAME', 1.5, 8.3], ['PRICE', 5.58, 12.5]]);
    });
});
