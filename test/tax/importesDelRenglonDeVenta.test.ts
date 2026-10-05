/**
 * D7b · IVA e IEPS en el mismo renglón. Los mismos vectores viven en
 * `Pittaj.Tests/Domain/ImportesDeVentaTests.cs`.
 */
import { describe, expect, it } from 'vitest';
import { importesDelRenglonDeVenta } from '../../src/tax/importesDelRenglonDeVenta.js';
import { trasladoDeIeps } from '../../src/tax/impuestoDelRenglon.js';

describe('D7b · importes con IVA e IEPS', () => {
    it('refresco de 600 ml a $18 de etiqueta: IEPS por cuota ($1.6451/L) e IVA sobre base + IEPS', () => {
        const r = importesDelRenglonDeVenta({
            cantidad: 1, factorDeUnidad: 0.6, precioUnitario: 18, tasaIva: 0.16,
            ieps: { factor: 'Cuota', tasaOCuota: 1.6451 }, impuestosIncluidos: true,
        });
        expect(r).toEqual({ subtotal: 14.53, descuento: 0, base: 14.53, ieps: 0.99, baseIva: 15.52, iva: 2.48, total: 18, unidadesDeCuota: 0.6 });
        expect(trasladoDeIeps('Cuota', 1.6451, r.base, r.unidadesDeCuota, r.ieps)).toEqual({
            impuesto: '003', tipoFactor: 'Cuota', tasaOCuota: 1.6451, base: 0.6, importe: 0.99,
        });
    });

    it('botana a $20 de etiqueta: IEPS 8 % por tasa', () => {
        const r = importesDelRenglonDeVenta({
            cantidad: 1, precioUnitario: 20, tasaIva: 0.16, ieps: { factor: 'Tasa', tasaOCuota: 0.08 }, impuestosIncluidos: true,
        });
        expect(r).toEqual({ subtotal: 15.96, descuento: 0, base: 15.96, ieps: 1.28, baseIva: 17.24, iva: 2.76, total: 20, unidadesDeCuota: 0 });
    });

    it('precio sin impuestos: base 100, IEPS 8 %, IVA 16 % sobre 108', () => {
        const r = importesDelRenglonDeVenta({
            cantidad: 2, precioUnitario: 50, tasaIva: 0.16, ieps: { factor: 'Tasa', tasaOCuota: 0.08 }, impuestosIncluidos: false,
        });
        expect(r).toMatchObject({ base: 100, ieps: 8, baseIva: 108, iva: 17.28, total: 125.28 });
    });

    it('cigarros: IEPS 160 % por tasa', () => {
        const r = importesDelRenglonDeVenta({
            cantidad: 1, precioUnitario: 50, tasaIva: 0.16, ieps: { factor: 'Tasa', tasaOCuota: 1.6 }, impuestosIncluidos: false,
        });
        expect(r).toMatchObject({ ieps: 80, baseIva: 130, iva: 20.8, total: 150.8 });
    });

    it('sin IEPS es el cálculo de siempre (con descuento)', () => {
        const r = importesDelRenglonDeVenta({ cantidad: 1, precioUnitario: 116, descuentoPorcentaje: 10, tasaIva: 0.16, impuestosIncluidos: true });
        expect(r).toMatchObject({ total: 104.4, base: 90, iva: 14.4, descuento: 11.6, subtotal: 101.6 });
    });
});

import { createTaxSchema } from '../../src/tax/schemas/createTax.schema.js';

describe('D7b · el catálogo acepta un IEPS por cuota', () => {
    const base = { id: '00000000-0000-4000-8000-000000000002', name: 'IEPS refrescos', isIncluded: true, satCode: '003' };
    it('cuota en pesos por unidad, mayor que 1', () => {
        expect(createTaxSchema.safeParse({ ...base, rate: 1.6451, kind: 'IEPS', satFactor: 'Cuota' }).success).toBe(true);
    });
    it('por tasa puede pasar del 100 % (tabaco 160 %); el IVA no', () => {
        expect(createTaxSchema.safeParse({ ...base, rate: 0.08, kind: 'IEPS', satFactor: 'Tasa' }).success).toBe(true);
        expect(createTaxSchema.safeParse({ ...base, rate: 1.6, kind: 'IEPS', satFactor: 'Tasa' }).success).toBe(true);
        expect(createTaxSchema.safeParse({ ...base, rate: 16, kind: 'IVA', satFactor: 'Tasa' }).success).toBe(false);
        expect(createTaxSchema.safeParse({ ...base, rate: 0, kind: 'IEPS', satFactor: 'Cuota' }).success).toBe(false);
        expect(createTaxSchema.safeParse({ ...base, rate: 8, kind: 'IEPS', satFactor: 'Tasa' }).success).toBe(false);
    });
});
