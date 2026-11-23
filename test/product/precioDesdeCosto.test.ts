import { describe, expect, it } from 'vitest';
import { costoRealDeLaBase, margenesPorUnidad, margenSobrePrecio, precioPropuesto } from '../../src/product/index.js';

/** U-T4 · Espejo: `PrecioDesdeCostoTests.cs` (escritorio), mismos casos. */
describe('precio desde el costo real', () => {
    it('el margen es sobre el precio', () => {
        expect(margenSobrePrecio(62, 54)).toBe(12.9);
        expect(margenSobrePrecio(0, 54)).toBeNull();
    });

    it('costo + %: hacia arriba al redondeo pedido', () => {
        expect(precioPropuesto(54, 30)).toBe(70.2);
        expect(precioPropuesto(54, 30, 0.5)).toBe(70.5);
        expect(precioPropuesto(54, 30, 1)).toBe(71);
        expect(precioPropuesto(50, 20, 0.5)).toBe(60);
        expect(precioPropuesto(0, 30)).toBeNull();
        expect(precioPropuesto(54, null)).toBeNull();
    });

    it('cada unidad que se vende con su costo, margen y propuesto', () => {
        const filas = margenesPorUnidad(
            { precioBase: 62, costoBase: 54, etiquetaBase: 'Tapa', units: [{ name: 'Caja', factor: 12, price: 720 }, { name: 'Kilo', factor: 0.5556, sellable: false }, { name: 'Media', factor: 0.5 }] },
            30,
            0.5
        );
        expect(filas.map((f) => [f.etiqueta, f.precio, f.proporcional, f.costo, f.margen, f.propuesto])).toEqual([
            ['Tapa', 62, false, 54, 12.9, 70.5],
            ['Caja', 720, false, 648, 10, 842.5],
            ['Media', 31, true, 27, 12.9, 35.5],
        ]);
    });

    it('costo real: el promedio de lo que hay; sin existencia, el de la ficha', () => {
        expect(costoRealDeLaBase([{ onHand: 100, averageCost: 50 }, { onHand: 300, averageCost: 54 }], 40)).toBe(53);
        expect(costoRealDeLaBase([], 40)).toBe(40);
    });
});
