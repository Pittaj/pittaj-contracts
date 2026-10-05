/**
 * D7c · Retenciones del CFDI de venta. Los mismos vectores viven en
 * `Pittaj.Tests/Domain/RetencionesDeLaVentaTests.cs`.
 */
import { describe, expect, it } from 'vitest';
import {
    agruparRetenciones,
    decidirRetenciones,
    prorratearRetenciones,
    retencionesDelConcepto,
    sinRetenciones,
    tasasDeRetencion,
    totalRetenido,
    validarRetenciones,
} from '../../src/tax/retencionesDeLaVenta.js';
import { retencionesDecididasSchema } from '../../src/sales-cfdi/schemas/saleCfdi.schema.js';

const PF_612 = { rfc: 'GOMA800101AB1', regimenFiscal: '612' };
const PF_606 = { rfc: 'GOMA800101AB1', regimenFiscal: '606' };
const PF_RESICO = { rfc: 'GOMA800101AB1', regimenFiscal: '626' };
const PM = { rfc: 'ABC010101AB1', regimenFiscal: '601' };
const PF_RECEPTOR = { rfc: 'LOPE900101XY2', regimenFiscal: '605' };
const PF_EMPRESARIAL = { rfc: 'LOPE900101XY2', regimenFiscal: '612' };
const PUBLICO = { rfc: 'XAXX010101000', regimenFiscal: '616' };

describe('D7c · quién retiene qué', () => {
    it('honorarios de persona física a persona moral: ISR 10 % e IVA ⅔', () => {
        const t = tasasDeRetencion(PF_612, PM, 'HONORARIOS');
        expect(t?.isr).toBe(0.1);
        expect(t?.iva).toEqual({ modo: 'DOS_TERCIOS' });
        expect(t?.fundamento).toContain('LISR art. 106');
    });

    it('arrendamiento de persona física a persona moral: ISR 10 % (art. 116) e IVA ⅔', () => {
        const t = tasasDeRetencion(PF_606, PM, 'ARRENDAMIENTO');
        expect(t?.isr).toBe(0.1);
        expect(t?.fundamento).toContain('LISR art. 116');
    });

    it('RESICO a persona moral: ISR 1.25 % en lugar del 10 %, en servicios y en bienes', () => {
        expect(tasasDeRetencion(PF_RESICO, PM, 'HONORARIOS')?.isr).toBe(0.0125);
        expect(tasasDeRetencion(PF_RESICO, PM, null)).toEqual({ isr: 0.0125, iva: null, fundamento: 'ISR 1.25 % (LISR art. 113-J)' });
    });

    it('a una persona física, a público en general o entre morales no se retiene (salvo fletes y personal)', () => {
        expect(tasasDeRetencion(PF_612, PF_RECEPTOR, 'HONORARIOS')).toBeNull();
        expect(tasasDeRetencion(PF_612, PUBLICO, 'HONORARIOS')).toBeNull();
        expect(tasasDeRetencion(PM, PM, 'HONORARIOS')).toBeNull();
        expect(tasasDeRetencion(PF_612, PM, null)).toBeNull();
    });

    it('fletes a persona moral: IVA 4 % sin importar quién emite', () => {
        expect(tasasDeRetencion(PM, PM, 'FLETES')).toMatchObject({ isr: null, iva: { modo: 'TASA', tasa: 0.04 } });
        expect(tasasDeRetencion(PF_612, PM, 'FLETES')).toMatchObject({ isr: null, iva: { modo: 'TASA', tasa: 0.04 } });
        expect(tasasDeRetencion(PM, PF_EMPRESARIAL, 'FLETES')).toBeNull();
    });

    it('personal a disposición: IVA 6 % a moral o a física con actividad empresarial', () => {
        expect(tasasDeRetencion(PM, PM, 'PERSONAL')?.iva).toEqual({ modo: 'TASA', tasa: 0.06 });
        expect(tasasDeRetencion(PM, PF_EMPRESARIAL, 'PERSONAL')?.iva).toEqual({ modo: 'TASA', tasa: 0.06 });
        expect(tasasDeRetencion(PM, PF_RECEPTOR, 'PERSONAL')).toBeNull();
    });

    it('la decisión junta las clases del comprobante y omite las que no retienen', () => {
        const d = decidirRetenciones(PF_612, PM, ['HONORARIOS', null, 'HONORARIOS']);
        expect(Object.keys(d)).toEqual(['HONORARIOS']);
        expect(sinRetenciones(decidirRetenciones(PF_612, PF_RECEPTOR, ['HONORARIOS']))).toBe(true);
    });
});

describe('D7c · importes', () => {
    it('honorarios de $10,000 + IVA: retiene ISR 1,000.00 e IVA 1,066.67; el cliente paga 9,533.33', () => {
        const d = decidirRetenciones(PF_612, PM, ['HONORARIOS']);
        const rs = retencionesDelConcepto(d, { clase: 'HONORARIOS', base: 10_000, baseIva: 10_000, tasaIva: 0.16 });
        expect(rs).toEqual([
            { impuesto: '001', tipoFactor: 'Tasa', tasaOCuota: 0.1, base: 10_000, importe: 1_000 },
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.106667, base: 10_000, importe: 1_066.67 },
        ]);
        expect(10_000 + 1_600 - totalRetenido(rs)).toBeCloseTo(9_533.33, 2);
    });

    it('⅔ del IVA en la frontera (8 %) es 5.3333 %', () => {
        const d = decidirRetenciones(PF_612, PM, ['HONORARIOS']);
        const [, iva] = retencionesDelConcepto(d, { clase: 'HONORARIOS', base: 1_000, baseIva: 1_000, tasaIva: 0.08 });
        expect(iva).toEqual({ impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.053333, base: 1_000, importe: 53.33 });
    });

    it('sin IVA trasladado (exento, tasa 0) no se retiene IVA; el ISR sí', () => {
        const d = decidirRetenciones(PF_606, PM, ['ARRENDAMIENTO']);
        const rs = retencionesDelConcepto(d, { clase: 'ARRENDAMIENTO', base: 5_000, baseIva: 5_000, tasaIva: 0 });
        expect(rs).toEqual([{ impuesto: '001', tipoFactor: 'Tasa', tasaOCuota: 0.1, base: 5_000, importe: 500 }]);
    });

    it('un renglón de otra clase no retiene', () => {
        const d = decidirRetenciones(PF_612, PM, ['HONORARIOS']);
        expect(retencionesDelConcepto(d, { clase: null, base: 100, baseIva: 100, tasaIva: 0.16 })).toEqual([]);
    });

    it('fletes $2,500: IVA retenido 100.00', () => {
        const d = decidirRetenciones(PM, PM, ['FLETES']);
        expect(totalRetenido(retencionesDelConcepto(d, { clase: 'FLETES', base: 2_500, baseIva: 2_500, tasaIva: 0.16 }))).toBe(100);
    });

    it('agrupa por impuesto y tasa, y prorratea para el complemento de pago', () => {
        const d = decidirRetenciones(PF_612, PM, ['HONORARIOS']);
        const rs = [
            ...retencionesDelConcepto(d, { clase: 'HONORARIOS', base: 1_000, baseIva: 1_000, tasaIva: 0.16 }),
            ...retencionesDelConcepto(d, { clase: 'HONORARIOS', base: 3_000, baseIva: 3_000, tasaIva: 0.16 }),
        ];
        const g = agruparRetenciones(rs);
        expect(g.map((r) => [r.impuesto, r.base, r.importe])).toEqual([['001', 4_000, 400], ['002', 4_000, 426.67]]);
        expect(prorratearRetenciones(g, 0.5).map((r) => r.importe)).toEqual([200, 213.34]);
    });
});

describe('D7c · ajuste a mano', () => {
    it('valida tasas fuera de rango', () => {
        expect(validarRetenciones({ HONORARIOS: { isr: 0.5, iva: null } })).toContain('ISR');
        expect(validarRetenciones({ FLETES: { isr: null, iva: { modo: 'TASA', tasa: 0.2 } } })).toContain('IVA');
        expect(validarRetenciones({ HONORARIOS: { isr: 0.1, iva: { modo: 'DOS_TERCIOS' } } })).toBeNull();
    });

    it('el esquema de la API acepta la decisión y rechaza claves desconocidas', () => {
        expect(retencionesDecididasSchema.safeParse({ GENERAL: { isr: 0.0125, iva: null } }).success).toBe(true);
        expect(retencionesDecididasSchema.safeParse({ OTRA: { isr: 0.1, iva: null } }).success).toBe(false);
    });
});
