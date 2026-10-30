import { describe, expect, it } from 'vitest';
import {
    createWarehouseSchema,
    reglasDeBodega,
    sucursalQueSeQuedaSinVenta,
    type BodegaParaVenta,
} from '../../src/inventory/index.js';

/** Espejo en el escritorio: `ReglasDeBodegaTests.cs`, mismos casos. */
describe('reglasDeBodega', () => {
    it('sin capturar, manda el tipo; lo capturado gana', () => {
        expect(reglasDeBodega('STORE')).toEqual({ allowsSale: true, countsInAvailable: true });
        expect(reglasDeBodega('WAREHOUSE')).toEqual({ allowsSale: false, countsInAvailable: true });
        expect(reglasDeBodega('QUARANTINE')).toEqual({ allowsSale: false, countsInAvailable: false });
        expect(reglasDeBodega('WAREHOUSE', true, null)).toEqual({ allowsSale: true, countsInAvailable: true });
    });
    it('la de tránsito no se da de alta a mano', () => {
        const base = { id: '00000000-0000-4000-8000-000000000001', name: 'Camino' };
        expect(createWarehouseSchema.safeParse({ ...base, type: 'TRANSIT' }).success).toBe(false);
        expect(createWarehouseSchema.safeParse({ ...base, type: 'QUARANTINE' }).success).toBe(true);
    });
});

describe('sucursalQueSeQuedaSinVenta', () => {
    const b = (
        id: string,
        locationId: string | null,
        allowsSale = true,
        status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE',
    ): BodegaParaVenta => ({
        id,
        locationId,
        allowsSale,
        status,
    });
    const todas = [b('piso', 'centro'), b('almacen', 'centro', false), b('norte', 'norte')];

    it('quitarle la venta a la única de venta de la sucursal se detiene', () => {
        expect(sucursalQueSeQuedaSinVenta(todas, b('piso', 'centro', false))).toBe('centro');
        expect(sucursalQueSeQuedaSinVenta(todas, b('piso', 'centro', true, 'INACTIVE'))).toBe('centro');
        // Moverla a otra sucursal también deja sin venta a la de origen.
        expect(sucursalQueSeQuedaSinVenta(todas, b('piso', 'norte'))).toBe('centro');
    });
    it('con otra de venta en la sucursal, o si ya no vendía, pasa', () => {
        expect(sucursalQueSeQuedaSinVenta([...todas, b('piso2', 'centro')], b('piso', 'centro', false))).toBeUndefined();
        expect(sucursalQueSeQuedaSinVenta(todas, b('almacen', 'centro', false, 'INACTIVE'))).toBeUndefined();
        expect(sucursalQueSeQuedaSinVenta(todas, b('nueva', 'centro', false))).toBeUndefined();
    });
    it('las bodegas sin sucursal cuentan como un grupo', () => {
        expect(sucursalQueSeQuedaSinVenta([b('principal', null)], b('principal', null, false))).toBeNull();
    });
});
