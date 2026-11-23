import { describe, expect, it } from 'vitest';
import { pesoRealPorProveedor } from '../../src/purchase/index.js';

/** U-T4 · Espejo: `PesoRealPorProveedorTests.cs` (escritorio), mismos casos. */
describe('peso real por proveedor', () => {
    it('agrupa, pondera y ordena por costo real por unidad', () => {
        const r = pesoRealPorProveedor([
            { supplierId: 'a', supplierName: 'Avícola', fecha: '2026-11-01', cantidad: 540, contada: 300, importe: 16200 },
            { supplierId: 'a', supplierName: 'Avícola', fecha: '2026-11-08', cantidad: 540, contada: 290, importe: 16200 },
            { supplierId: 'b', supplierName: 'Granja', fecha: '2026-11-05', cantidad: 500, contada: 300, importe: 15500 },
            { supplierId: 'b', supplierName: 'Granja', fecha: '2026-11-06', cantidad: 0, contada: 10, importe: 1 },
        ]);
        expect(r.map((x) => [x.supplierName, x.entregas, x.factor, x.inverso, x.minimo, x.maximo, x.ultimo, x.costoPorUnidad])).toEqual([
            ['Granja', 1, 0.6, 1.6667, 0.6, 0.6, 0.6, 51.6667],
            ['Avícola', 2, 0.5463, 1.8305, 0.537, 0.5556, 0.537, 54.9153],
        ]);
    });
});
