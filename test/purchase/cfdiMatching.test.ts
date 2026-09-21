/**
 * @fileoverview El emparejado que aprende hacia adelante.
 *
 * Lo que se prueba es el escenario del dueño: compra azúcar a Bimbo, la renombra, y luego se la
 * factura La Costeña con otras palabras. El sistema tiene que reconocerla **sin preguntar dos
 * veces** — y NO tiene que mezclar la refinada de 1 kg con el saco de 25 por mucho que compartan
 * clave SAT.
 *
 * Espejo de `CfdiMatchingTests.cs` del escritorio: los mismos casos, los mismos números.
 */

import { describe, it, expect } from 'vitest';
import {
    conceptoSimilarity,
    conceptoTokens,
    looksLikeBarcode,
    matchCfdiConceptos,
    summarizeCfdiMatch,
    type CfdiCatalogProduct,
    type CfdiConceptoInput,
} from '../../src/purchase/cfdiMatching';

const concepto = (descripcion: string, extra: Partial<CfdiConceptoInput> = {}): CfdiConceptoInput => ({
    claveProdServ: '50161500',
    claveUnidad: 'H87',
    noIdentificacion: null,
    descripcion,
    cantidad: 1,
    valorUnitario: 100,
    importe: 100,
    descuento: 0,
    taxRate: 0.16,
    ...extra,
});

/** El catálogo del dueño después del primer XML de Bimbo y de renombrar el producto. */
const azucarMoreno: CfdiCatalogProduct = {
    id: 'p-azucar',
    name: 'Azucar Moreno',
    satProductCode: '50161500',
    barcode: '7501000112345',
    aliases: [{ text: 'AZUCAR ESTANDAR DE 25KG', supplierRfc: 'BIM011112AB3' }],
};
const harina: CfdiCatalogProduct = { id: 'p-harina', name: 'Harina de trigo 20 kg', satProductCode: '50221201' };
const catalogo = { products: [azucarMoreno, harina], learned: {} };

describe('tokens y parecido', () => {
    it('pega la cantidad a su unidad y quita acentos y relleno', () => {
        expect(conceptoTokens('AZÚCAR ESTÁNDAR DE 25 KG')).toEqual(['AZUCAR', 'ESTANDAR', '25KG']);
        expect(conceptoTokens('azucar est. 25kg')).toEqual(['AZUCAR', 'EST', '25KG']);
        expect(conceptoTokens('Leche deslactosada 1 LT c/12')).toEqual(['LECHE', 'DESLACTOSADA', '1L', '12']);
    });

    it('«EST.» se parece a «ESTANDAR»: prefijo con crédito parcial', () => {
        const s = conceptoSimilarity('AZUCAR EST. 25 KG', 'AZUCAR ESTANDAR DE 25KG');
        expect(s).toBeGreaterThanOrEqual(85);
    });

    it('la refinada de 1 kg NO se parece al saco de 25: la cantidad discrepa y recorta a la mitad', () => {
        const s = conceptoSimilarity('AZUCAR REFINADA 1 KG', 'AZUCAR ESTANDAR DE 25KG');
        expect(s).toBeLessThan(70);
    });

    it('un nombre idéntico vale 100 aunque cambien mayúsculas, acentos y espacios', () => {
        expect(conceptoSimilarity('  azúcar   moreno ', 'AZUCAR MORENO')).toBe(100);
    });
});

describe('matchCfdiConceptos', () => {
    it('el mismo proveedor, después de renombrar el producto, empareja por memoria (LEARNED)', () => {
        const r = matchCfdiConceptos([concepto('AZUCAR ESTANDAR DE 25KG')], {
            ...catalogo,
            learned: { 'DESC:AZUCAR ESTANDAR DE 25KG': 'p-azucar' },
        });
        expect(r[0]!.matchedBy).toBe('LEARNED');
        expect(r[0]!.matchedProductId).toBe('p-azucar');
    });

    it('otro proveedor con otras palabras: SUGIERE el producto por el alias de Bimbo, con porcentaje', () => {
        const [r] = matchCfdiConceptos([concepto('AZUCAR EST. 25 KG')], catalogo);
        expect(r!.matchedBy).toBe('SUGGESTED');
        expect(r!.matchedProductId).toBeNull();
        expect(r!.suggestedProductId).toBe('p-azucar');
        expect(r!.matchScore).toBeGreaterThanOrEqual(85);
        expect(r!.matchedAlias).toBe('AZUCAR ESTANDAR DE 25KG');
        expect(r!.matchedAliasSupplierRfc).toBe('BIM011112AB3');
    });

    it('una sugerencia no cuenta como emparejado en el resumen: pide un clic', () => {
        const r = matchCfdiConceptos([concepto('AZUCAR EST. 25 KG')], catalogo);
        expect(summarizeCfdiMatch(r)).toEqual({ matched: 0, unmatched: 1, documentCharges: 0 });
    });

    it('el código de barras empareja seguro, sea el proveedor que sea', () => {
        const [r] = matchCfdiConceptos([concepto('AZUCAR ESTANDAR MORENA SACO 25', { noIdentificacion: '7501000112345' })], catalogo);
        expect(r!.matchedBy).toBe('BARCODE');
        expect(r!.matchedProductId).toBe('p-azucar');
    });

    it('la clave SAT ya no empareja sola: la refinada de 1 kg se queda sin sugerencia', () => {
        const [r] = matchCfdiConceptos([concepto('AZUCAR REFINADA 1 KG')], catalogo);
        expect(r!.matchedBy).toBe('NONE');
        expect(r!.suggestedProductId).toBeNull();
    });

    it('el alias idéntico de otro proveedor empareja al 100 (ALIAS), sin pedir clic', () => {
        const [r] = matchCfdiConceptos([concepto('azucar estandar de 25 kg')], catalogo);
        expect(r!.matchedBy).toBe('ALIAS');
        expect(r!.matchedProductId).toBe('p-azucar');
        expect(r!.matchScore).toBe(100);
    });

    it('dos candidatos empatados: no sugiere ninguno, salvo que solo uno comparta la clave SAT', () => {
        const a: CfdiCatalogProduct = { id: 'a', name: 'Refresco cola 600 ml', satProductCode: '50202306' };
        const b: CfdiCatalogProduct = { id: 'b', name: 'Refresco cola 600 ml light', satProductCode: '50202307' };
        const [sinSat] = matchCfdiConceptos([concepto('REFRESCO DE COLA 600ML NR', { claveProdServ: '99999999' })], { products: [a, b], learned: {} });
        // `a` gana por bastante (b arrastra «LIGHT»), así que sí se sugiere a; «NR» de más impide el 100.
        expect(sinSat!.matchedBy).toBe('SUGGESTED');
        expect(sinSat!.suggestedProductId).toBe('a');

        const c: CfdiCatalogProduct = { id: 'c', name: 'Refresco cola 600 ml', satProductCode: '50202307' };
        const [empate] = matchCfdiConceptos([concepto('REFRESCO DE COLA 600ML', { claveProdServ: '99999999' })], { products: [a, c], learned: {} });
        expect(empate!.matchedBy).toBe('NONE');
        const [desempate] = matchCfdiConceptos([concepto('REFRESCO DE COLA 600ML', { claveProdServ: '50202307' })], { products: [a, c], learned: {} });
        expect(desempate!.matchedBy).toBe('NAME');
        expect(desempate!.matchedProductId).toBe('c');
    });

    it('un flete ni empareja ni se sugiere, aunque se parezca a algo', () => {
        const flete: CfdiCatalogProduct = { id: 'f', name: 'Flete local', satProductCode: '78101800' };
        const [r] = matchCfdiConceptos([concepto('FLETE LOCAL', { claveProdServ: '78101800' })], { products: [flete], learned: {} });
        expect(r!.suggestedDocumentCharge).toBe(true);
        expect(r!.matchedBy).toBe('NONE');
    });
});

describe('looksLikeBarcode', () => {
    it('EAN-13, UPC-A, EAN-8 y GTIN-14 sí; una clave de proveedor no', () => {
        expect(looksLikeBarcode('7501000112345')).toBe(true);
        expect(looksLikeBarcode('012345678905')).toBe(true);
        expect(looksLikeBarcode('12345670')).toBe(true);
        expect(looksLikeBarcode('AZ25')).toBe(false);
        expect(looksLikeBarcode('12345')).toBe(false);
        expect(looksLikeBarcode(null)).toBe(false);
    });
});
