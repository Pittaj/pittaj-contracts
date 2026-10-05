/**
 * D7d · Impuestos locales y moneda del comprobante. Los mismos vectores viven en
 * `Pittaj.Tests/Domain/ImpuestosLocalesTests.cs`.
 */
import { describe, expect, it } from 'vitest';
import { importesDelRenglonDeVenta } from '../../src/tax/importesDelRenglonDeVenta.js';
import { agruparImpuestosLocales, impuestoLocal, totalRetencionesLocales, totalTrasladosLocales } from '../../src/tax/impuestosLocales.js';
import { decidirRetenciones, retencionLocalDelConcepto, validarRetenciones } from '../../src/tax/retencionesDeLaVenta.js';
import { monedaDelComprobante, requiereTipoCambio } from '../../src/sales-cfdi/monedaDelComprobante.js';

describe('D7d · impuesto local trasladado en el renglón', () => {
    it('noche de hotel a $1,190 de etiqueta con IVA 16 % e ISH 3 %: base 1,000', () => {
        const r = importesDelRenglonDeVenta({ cantidad: 1, precioUnitario: 1_190, tasaIva: 0.16, tasaLocal: 0.03, impuestosIncluidos: true });
        expect(r).toMatchObject({ base: 1_000, baseIva: 1_000, iva: 160, local: 30, total: 1_190 });
    });

    it('sin impuestos incluidos: el ISH no entra en la base del IVA', () => {
        const r = importesDelRenglonDeVenta({ cantidad: 2, precioUnitario: 500, tasaIva: 0.16, tasaLocal: 0.03, impuestosIncluidos: false });
        expect(r).toMatchObject({ base: 1_000, iva: 160, local: 30, total: 1_190 });
    });

    it('con IEPS por tasa: total = base·(1+i)·(1+v) + base·l', () => {
        const r = importesDelRenglonDeVenta({
            cantidad: 1, precioUnitario: 128.28, tasaIva: 0.16, ieps: { factor: 'Tasa', tasaOCuota: 0.08 }, tasaLocal: 0.03, impuestosIncluidos: true,
        });
        expect(r).toMatchObject({ base: 100, ieps: 8, baseIva: 108, local: 3, total: 128.28 });
        expect(r.iva).toBe(17.28);
    });

    it('agrupa por nombre y tasa y suma traslados y retenciones aparte', () => {
        const xs = agruparImpuestosLocales([
            impuestoLocal('ISH', 'TRASLADO', 0.03, 1_000),
            impuestoLocal('ISH', 'TRASLADO', 0.03, 500),
            impuestoLocal('Cedular', 'RETENCION', 0.02, 1_000),
        ]);
        expect(xs).toHaveLength(2);
        expect(totalTrasladosLocales(xs)).toBe(45);
        expect(totalRetencionesLocales(xs)).toBe(20);
    });
});

describe('D7d · retención local (cedular) capturada por quien timbra', () => {
    it('se suma a la decisión de la clase y sale sobre la base sin impuestos', () => {
        const d = decidirRetenciones({ rfc: 'GOMA800101AB1', regimenFiscal: '612' }, { rfc: 'ABC010101AB1' }, ['HONORARIOS']);
        const conCedular = { HONORARIOS: { ...d.HONORARIOS!, local: { nombre: 'Cedular Guanajuato', tasa: 0.02 } } };
        expect(retencionLocalDelConcepto(conCedular, { clase: 'HONORARIOS', base: 10_000 })).toEqual([
            { nombre: 'Cedular Guanajuato', tipo: 'RETENCION', tasa: 0.02, base: 10_000, importe: 200 },
        ]);
        expect(validarRetenciones({ HONORARIOS: { isr: 0.1, iva: null, local: { nombre: '', tasa: 0.02 } } })).toContain('local');
    });
});

describe('D7d · moneda del comprobante', () => {
    it('MXN no lleva tipo de cambio; otra moneda lo exige', () => {
        expect(monedaDelComprobante('MXN', 17)).toEqual({ ok: true, moneda: 'MXN' });
        expect(monedaDelComprobante('usd')).toMatchObject({ ok: false });
        expect(monedaDelComprobante('USD', 18.1234567)).toEqual({ ok: true, moneda: 'USD', tipoCambio: 18.123457 });
        expect(monedaDelComprobante('XXX', 1)).toMatchObject({ ok: false });
        expect(requiereTipoCambio('USD')).toBe(true);
        expect(requiereTipoCambio(null)).toBe(false);
    });
});
