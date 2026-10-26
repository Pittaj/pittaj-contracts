/**
 * Vectores de la venta sin caja. Los mismos viven en el escritorio
 * (`Pittaj.Tests/Domain/VentaSinCajaTests.cs`): si uno cambia, cambian los dos.
 */
import { describe, expect, it } from 'vitest';
import {
    createDirectSaleSchema,
    impuestoDeSnapshot,
    importesDeRenglonSinCaja,
    totalesDeVentaSinCaja,
} from '../../src/direct-sale/index.js';

describe('importesDeRenglonSinCaja', () => {
    it('IVA 16 % sobre el precio', () => {
        const r = importesDeRenglonSinCaja({ cantidad: 1, precioUnitario: 1000, impuesto: 'IVA', tasaIva: 0.16 });
        expect(r).toMatchObject({ subtotal: 1000, descuento: 0, base: 1000, iva: 160, total: 1160 });
        expect(r.snapshot).toEqual({ taxCode: '002', taxFactor: 'Tasa', taxPercent: 0.16 });
    });

    it('IVA incluido en el precio: el total es el precio', () => {
        const r = importesDeRenglonSinCaja({ cantidad: 1, precioUnitario: 1160, impuesto: 'IVA', impuestosIncluidos: true });
        expect(r).toMatchObject({ base: 1000, iva: 160, total: 1160 });
    });

    it('descuento y redondeo por renglón', () => {
        const r = importesDeRenglonSinCaja({
            cantidad: 3,
            precioUnitario: 333.33,
            descuentoPorcentaje: 10,
            impuesto: 'IVA',
            tasaIva: 0.16,
        });
        expect(r).toMatchObject({ subtotal: 999.99, descuento: 100, base: 899.99, iva: 144, total: 1043.99 });
    });

    it('IVA 8 % de la región fronteriza', () => {
        expect(importesDeRenglonSinCaja({ cantidad: 1, precioUnitario: 100, impuesto: 'IVA', tasaIva: 0.08 }).iva).toBe(8);
    });

    it('tasa 0, exento y no objeto no cobran IVA, y se guardan distinto', () => {
        const cero = importesDeRenglonSinCaja({ cantidad: 1, precioUnitario: 500, impuesto: 'ZERO' });
        const exento = importesDeRenglonSinCaja({ cantidad: 1, precioUnitario: 500, impuesto: 'EXEMPT' });
        const noObjeto = importesDeRenglonSinCaja({ cantidad: 1, precioUnitario: 500, impuesto: 'NOT_OBJECT' });
        for (const r of [cero, exento, noObjeto]) expect(r).toMatchObject({ base: 500, iva: 0, total: 500 });
        expect(cero.snapshot).toEqual({ taxCode: '002', taxFactor: 'Tasa', taxPercent: 0 });
        expect(exento.snapshot).toEqual({ taxCode: '002', taxFactor: 'Exento', taxPercent: 0 });
        expect(noObjeto.snapshot).toEqual({ taxCode: null, taxFactor: null, taxPercent: 0 });
    });

    it('la tasa se ignora si el renglón no es IVA', () => {
        expect(importesDeRenglonSinCaja({ cantidad: 1, precioUnitario: 100, impuesto: 'EXEMPT', tasaIva: 0.16 }).iva).toBe(0);
    });
});

describe('totalesDeVentaSinCaja', () => {
    it('suma los renglones ya redondeados', () => {
        const t = totalesDeVentaSinCaja([
            { cantidad: 1, precioUnitario: 1000, impuesto: 'IVA', tasaIva: 0.16 },
            { cantidad: 1, precioUnitario: 500, impuesto: 'EXEMPT' },
            { cantidad: 3, precioUnitario: 333.33, descuentoPorcentaje: 10, impuesto: 'IVA', tasaIva: 0.16 },
        ]);
        expect(t).toEqual({ subtotal: 2499.99, descuento: 100, base: 2399.99, iva: 304, ieps: 0, isrRetenido: 0, ivaRetenido: 0, total: 2703.99 });
    });
});

describe('impuestoDeSnapshot', () => {
    it('vuelve a la opción que produjo el snapshot', () => {
        expect(impuestoDeSnapshot('002', 'Tasa', 0.16)).toBe('IVA');
        expect(impuestoDeSnapshot('002', 'Tasa', 0)).toBe('ZERO');
        expect(impuestoDeSnapshot('002', 'Exento', 0)).toBe('EXEMPT');
        expect(impuestoDeSnapshot(null, null, 0)).toBe('NOT_OBJECT');
    });
});

describe('createDirectSaleSchema', () => {
    const base = {
        customerId: '00000000-0000-4000-8000-000000000001',
        locationId: '00000000-0000-4000-8000-000000000002',
        lines: [{ description: 'Iguala de octubre', satProductCode: '80111500', satUnitCode: 'E48', quantity: 1, unitPrice: 5000, tax: 'IVA', taxRate: 0.16 }],
    };

    it('acepta una venta mínima', () => {
        expect(createDirectSaleSchema.safeParse(base).success).toBe(true);
    });

    it('rechaza una tasa de IVA que no existe', () => {
        const r = createDirectSaleSchema.safeParse({ ...base, lines: [{ ...base.lines[0], taxRate: 0.15 }] });
        expect(r.success).toBe(false);
    });

    it('rechaza un renglón sin importe', () => {
        const r = createDirectSaleSchema.safeParse({ ...base, lines: [{ ...base.lines[0], unitPrice: 0 }] });
        expect(r.success).toBe(false);
    });

    it('pide cliente', () => {
        const { customerId: _, ...sinCliente } = base;
        expect(createDirectSaleSchema.safeParse(sinCliente).success).toBe(false);
    });
});
