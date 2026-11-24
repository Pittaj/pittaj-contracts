import { describe, expect, it } from 'vitest';
import { cambiarUnidadDeInventario, CambioDeUnidadInvalido } from '../../src/product/index.js';

/** U-T3 · Espejo: `CambioDeUnidadTests.cs` (escritorio), mismos casos. */
const huevoEnKilos = {
    etiquetaVieja: 'Kilo',
    nuevaBase: 'Tapa',
    unidades: [
        { name: 'Tapa', factor: 1.8, price: 62, sellable: true, purchasable: false, variable: true },
        { name: 'Caja', factor: 21.6, price: null, sellable: false, purchasable: true },
    ],
    precioBase: 36,
    baseVendible: false,
    baseComprable: true,
    existencias: [{ warehouseId: 'B1', quantity: 540, averageCost: 30 }, { warehouseId: 'B2', quantity: 0, averageCost: 30 }],
    contado: { B1: 300 },
};

describe('cambiar la unidad de inventario', () => {
    it('sale la existencia vieja y entra lo contado al mismo valor', () => {
        const r = cambiarUnidadDeInventario(huevoEnKilos);
        expect(r.movimientos).toEqual([{ warehouseId: 'B1', salida: 540, costoSalida: 30, entrada: 300, costoEntrada: 54, valor: 16200 }]);
    });

    it('las unidades se reexpresan contra la nueva base y la vieja queda como alterna', () => {
        const r = cambiarUnidadDeInventario(huevoEnKilos);
        expect(r.unidades.map((u) => [u.name, u.factor, u.variable ?? false])).toEqual([['Kilo', 0.5556, true], ['Caja', 12, false]]);
        expect([r.precioBase, r.baseVendible, r.baseComprable]).toEqual([62, true, false]);
        expect(r.unidades[0]).toMatchObject({ price: 36, sellable: false, purchasable: true });
    });

    it('sin precio propio, el precio nuevo es el viejo por el factor', () => {
        const r = cambiarUnidadDeInventario({ ...huevoEnKilos, nuevaBase: 'Caja' });
        expect(r.precioBase).toBe(777.6);
    });

    it('sin conteo en una bodega con existencia, no se cambia', () => {
        expect(() => cambiarUnidadDeInventario({ ...huevoEnKilos, contado: {} })).toThrow(CambioDeUnidadInvalido);
        expect(() => cambiarUnidadDeInventario({ ...huevoEnKilos, etiquetaVieja: 'caja' })).toThrow(/Ya hay/);
    });
});
