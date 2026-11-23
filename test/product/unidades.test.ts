import { describe, expect, it } from 'vitest';
import { faltaUnidad, unidadesDeCompra, unidadesDeVenta } from '../../src/product/index.js';

/** Espejo en el escritorio: `UnidadesQueSeCompranYSeVendenTests.cs`, mismos casos. */
const tapaYCaja = [
    { name: 'Tapa', factor: 1.8, price: 62, sellable: true, purchasable: false },
    { name: 'Caja', factor: 21.6, price: 720, sellable: true, purchasable: true },
];

describe('unidades que se venden y se compran', () => {
    it('la caja ofrece solo lo que se vende y la compra solo lo que se compra', () => {
        const huevo = { baseUnitSellable: false, baseUnitPurchasable: true, units: tapaYCaja };
        expect(unidadesDeVenta(huevo, 'Kg').map((o) => o.nombre)).toEqual(['Tapa', 'Caja']);
        expect(unidadesDeCompra(huevo, 'Kg').map((o) => o.nombre)).toEqual([null, 'Caja']);
        expect(unidadesDeVenta(huevo, 'Kg')[0]?.precio).toBe(62);
        expect(unidadesDeCompra(huevo, 'Kg')[0]?.etiqueta).toBe('Kg');
    });

    it('lo de siempre sigue igual: sin marcas, todo se vende y se compra', () => {
        const p = { units: [{ name: 'Caja', factor: 12, price: null }] };
        expect(unidadesDeVenta(p, 'Pieza').map((o) => o.nombre)).toEqual([null, 'Caja']);
        expect(unidadesDeCompra(p, 'Pieza').map((o) => o.nombre)).toEqual([null, 'Caja']);
    });

    it('si el producto se vende, alguna unidad tiene que venderse (y lo mismo al comprar)', () => {
        const soloCompra = [{ name: 'Caja', factor: 12, price: null, sellable: false }];
        expect(faltaUnidad({ baseUnitSellable: false, units: soloCompra })).toBe('Marca al menos una unidad que se venda.');
        const ninguna = [{ name: 'Tapa', factor: 1.8, price: null, purchasable: false }];
        expect(faltaUnidad({ baseUnitPurchasable: false, units: ninguna })).toBe('Marca al menos una unidad que se compre.');
        expect(faltaUnidad({ baseUnitSellable: false, baseUnitPurchasable: true, units: tapaYCaja })).toBeNull();
    });

    it('un producto que no se vende no exige unidad vendible', () => {
        expect(faltaUnidad({ canBeSold: false, baseUnitSellable: false, units: [] })).toBeNull();
    });
});
