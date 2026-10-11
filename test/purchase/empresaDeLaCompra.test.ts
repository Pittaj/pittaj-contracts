/**
 * D4 · La empresa de la compra y la bodega de su sucursal. Gemela: `EmpresaDeLaCompraTests.cs`.
 */
import { describe, expect, it } from 'vitest';
import { bodegasDeLaSucursal, empresaDeLaCompra } from '../../src/purchase/empresaDeLaCompra';

const HUE = { id: 'hue', companyId: 'e1', name: 'Huehuetlán' };
const PRINCIPAL_TEH = { id: 'b-teh', locationId: 'teh', companyId: 'e1', name: 'Principal' };
const GENERAL = { id: 'b-gen', locationId: null, companyId: null, name: 'General' };

describe('D4 · empresaDeLaCompra', () => {
    it('con sucursal, la de la sucursal', () => {
        expect(empresaDeLaCompra({ sucursal: HUE, bodega: GENERAL, empresas: ['e1', 'e2'] })).toEqual({ ok: true, companyId: 'e1' });
    });

    it('la bodega de otra sucursal no se acepta', () => {
        const r = empresaDeLaCompra({ sucursal: HUE, bodega: PRINCIPAL_TEH, empresas: ['e1'] });
        expect(r).toMatchObject({ ok: false, campo: 'bodega' });
    });

    it('gasto global: sin sucursal y una sola empresa, esa, sin preguntar', () => {
        expect(empresaDeLaCompra({ sucursal: null, bodega: GENERAL, empresas: ['e1'] })).toEqual({ ok: true, companyId: 'e1' });
    });

    it('gasto global con dos empresas: hay que elegirla', () => {
        expect(empresaDeLaCompra({ sucursal: null, bodega: GENERAL, empresas: ['e1', 'e2'] })).toMatchObject({ ok: false, campo: 'empresa' });
        expect(empresaDeLaCompra({ sucursal: null, bodega: GENERAL, elegida: 'e2', empresas: ['e1', 'e2'] })).toEqual({ ok: true, companyId: 'e2' });
    });

    it('gasto global: la elegida gana a la empresa de la bodega que nadie eligió', () => {
        expect(empresaDeLaCompra({ sucursal: null, bodega: PRINCIPAL_TEH, elegida: 'e2', empresas: ['e1', 'e2'] })).toEqual({ ok: true, companyId: 'e2' });
    });

    it('sin sucursal, la de la sucursal de la bodega', () => {
        expect(empresaDeLaCompra({ sucursal: null, bodega: PRINCIPAL_TEH, empresas: ['e1', 'e2'] })).toEqual({ ok: true, companyId: 'e1' });
    });

    it('un negocio sin empresas no se bloquea', () => {
        expect(empresaDeLaCompra({ sucursal: null, bodega: null, empresas: [] })).toEqual({ ok: true, companyId: null });
    });

    it('la elegida no puede contradecir a la sucursal ni ser de otro negocio', () => {
        expect(empresaDeLaCompra({ sucursal: HUE, bodega: GENERAL, elegida: 'e2', empresas: ['e1', 'e2'] })).toMatchObject({ ok: false, campo: 'empresa' });
        expect(empresaDeLaCompra({ sucursal: null, bodega: GENERAL, elegida: 'x', empresas: ['e1', 'e2'] })).toMatchObject({ ok: false, campo: 'empresa' });
    });
});

describe('D4 · bodegasDeLaSucursal', () => {
    it('las suyas y las generales; sin sucursal, todas', () => {
        const todas = [PRINCIPAL_TEH, GENERAL, { id: 'b-hue', locationId: 'hue', companyId: 'e1' }];
        expect(bodegasDeLaSucursal(todas, 'hue').map((b) => b.id)).toEqual(['b-gen', 'b-hue']);
        expect(bodegasDeLaSucursal(todas, null)).toHaveLength(3);
    });
});
