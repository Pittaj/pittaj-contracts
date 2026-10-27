/**
 * Vectores de la venta sin caja. Los mismos viven en el escritorio
 * (`Pittaj.Tests/Domain/VentaSinCajaTests.cs`): si uno cambia, cambian los dos.
 */
import { describe, expect, it } from 'vitest';
import {
    createDirectSaleSchema,
    impuestoDeSnapshot,
    importesDeRenglonSinCaja,
    retencionesDeVentaSinCaja,
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

describe('D3 · retencionesDeVentaSinCaja (vectores compartidos con VentaSinCaja.cs)', () => {
    const iva16 = { impuesto: 'IVA' as const, tasaIva: 0.16 };

    it('honorarios a una persona moral: ISR 10 % y ⅔ del IVA', () => {
        const r = retencionesDeVentaSinCaja(
            [{ cantidad: 1, precioUnitario: 1000, ...iva16, claseDeRetencion: 'HONORARIOS' }],
            { HONORARIOS: { isr: 0.1, iva: { modo: 'DOS_TERCIOS' } } },
        );
        expect(r).toEqual({ isr: 100, iva: 106.67 });
    });

    it('RESICO 1.25 % se redondea por renglón, como el CFDI', () => {
        const r = retencionesDeVentaSinCaja(
            [
                { cantidad: 1, precioUnitario: 333.33, ...iva16 },
                { cantidad: 1, precioUnitario: 666.67, ...iva16 },
            ],
            { GENERAL: { isr: 0.0125, iva: null } },
        );
        expect(r).toEqual({ isr: 12.5, iva: 0 });
    });

    it('con IEPS, el IVA se retiene sobre base + IEPS', () => {
        const r = retencionesDeVentaSinCaja(
            [{ cantidad: 1, precioUnitario: 100, ...iva16, ieps: { factor: 'Tasa', tasaOCuota: 0.08 }, claseDeRetencion: 'COMISIONES' }],
            { COMISIONES: { isr: null, iva: { modo: 'DOS_TERCIOS' } } },
        );
        expect(r).toEqual({ isr: 0, iva: 11.52 });
    });

    it('un renglón no objeto no retiene, y una clase fuera de la decisión tampoco', () => {
        const r = retencionesDeVentaSinCaja(
            [
                { cantidad: 1, precioUnitario: 500, impuesto: 'NOT_OBJECT' },
                { cantidad: 1, precioUnitario: 500, ...iva16, claseDeRetencion: 'FLETES' },
            ],
            { GENERAL: { isr: 0.0125, iva: null } },
        );
        expect(r).toEqual({ isr: 0, iva: 0 });
    });

    it('el esquema no acepta importes y tasas a la vez, ni retención local', () => {
        const base = {
            customerId: '11111111-1111-4111-8111-111111111111',
            locationId: '22222222-2222-4222-8222-222222222222',
            lines: [{ description: 'Asesoría', satProductCode: '80111600', satUnitCode: 'E48', quantity: 1, unitPrice: 1000, tax: 'IVA', taxRate: 0.16 }],
        };
        expect(createDirectSaleSchema.safeParse({ ...base, retenciones: { GENERAL: { isr: 0.0125 } } }).success).toBe(true);
        expect(createDirectSaleSchema.safeParse({ ...base, retenciones: {}, withholdings: { isr: 1, iva: 0 } }).success).toBe(false);
        expect(createDirectSaleSchema.safeParse({ ...base, retenciones: { GENERAL: { isr: null, local: { nombre: 'Cedular', tasa: 0.02 } } } }).success).toBe(false);
    });
});
