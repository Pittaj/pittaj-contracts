/**
 * D7a · El impuesto de un renglón de venta y los traslados de su concepto. Los vectores del
 * snapshot viven también en `Pittaj.Tests/Domain/ImpuestoDelRenglonTests.cs`.
 */
import { describe, expect, it } from 'vitest';
import {
    agruparTraslados,
    impuestoDelRenglon,
    objetoImpDelResumen,
    prorratearTraslados,
    snapshotDelImpuesto,
    totalTrasladado,
    trasladosDelConcepto,
} from '../../src/tax/impuestoDelRenglon.js';
import { createTaxSchema } from '../../src/tax/schemas/createTax.schema.js';

describe('D7a · lo que el punto de venta copia del catálogo', () => {
    it('distingue IVA, tasa 0, exento y no objeto', () => {
        expect(snapshotDelImpuesto('IVA', '002', 'Tasa')).toEqual({ taxCode: '002', taxFactor: 'Tasa' });
        expect(snapshotDelImpuesto('ZERO', null, 'Tasa')).toEqual({ taxCode: '002', taxFactor: 'Tasa' });
        expect(snapshotDelImpuesto('EXEMPT', null, 'Exento')).toEqual({ taxCode: '002', taxFactor: 'Exento' });
        expect(snapshotDelImpuesto('NOT_OBJECT')).toEqual({ taxCode: null, taxFactor: null });
        expect(snapshotDelImpuesto('IEPS', '003', 'Cuota')).toEqual({ taxCode: '003', taxFactor: 'Cuota' });
    });

    it('el catálogo acepta «no objeto» con tasa 0', () => {
        const base = { id: '00000000-0000-4000-8000-000000000001', name: 'No objeto', isIncluded: true };
        expect(createTaxSchema.safeParse({ ...base, rate: 0, kind: 'NOT_OBJECT' }).success).toBe(true);
        expect(createTaxSchema.safeParse({ ...base, rate: 0.16, kind: 'NOT_OBJECT' }).success).toBe(false);
    });
});

describe('D7a · el ObjetoImp del concepto', () => {
    it('la leche a tasa 0 es objeto 02 con IVA al 0 %, no 01', () => {
        const imp = impuestoDelRenglon({ taxCode: '002', taxFactor: 'Tasa', taxPercent: 0, taxAmount: 0 });
        expect(imp).toEqual({ objetoImp: '02', impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0 });
        expect(trasladosDelConcepto(imp, 25, 0)).toEqual([{ impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0, base: 25, importe: 0 }]);
    });

    it('lo exento es 02 con factor Exento y sin importe', () => {
        const imp = impuestoDelRenglon({ taxCode: '002', taxFactor: 'Exento', taxPercent: 0 });
        expect(trasladosDelConcepto(imp, 5000, 0)).toEqual([{ impuesto: '002', tipoFactor: 'Exento', tasaOCuota: null, base: 5000, importe: null }]);
    });

    it('lo no objeto es 01 y no lleva traslados', () => {
        const imp = impuestoDelRenglon({ taxCode: null, taxFactor: null, taxPercent: 0, taxAmount: 0 });
        expect(imp.objetoImp).toBe('01');
        expect(trasladosDelConcepto(imp, 100, 0)).toEqual([]);
    });

    it('lee las filas viejas: escritorio (null, Tasa) = tasa 0; (null, Exento) = exento; caja web con 16', () => {
        expect(impuestoDelRenglon({ taxCode: null, taxFactor: 'Tasa', taxPercent: 0 }).objetoImp).toBe('02');
        expect(impuestoDelRenglon({ taxCode: null, taxFactor: 'Exento', taxPercent: 0 }).tipoFactor).toBe('Exento');
        expect(impuestoDelRenglon({ taxCode: null, taxFactor: null, taxPercent: 16, taxAmount: 16 })).toEqual({
            objetoImp: '02', impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.16,
        });
    });

    it('IEPS por tasa y por cuota', () => {
        expect(impuestoDelRenglon({ taxCode: '003', taxFactor: 'Tasa', taxPercent: 0.08 }).tasaOCuota).toBe(0.08);
        expect(impuestoDelRenglon({ taxCode: '003', taxFactor: 'Cuota', taxPercent: 1.6451 })).toEqual({
            objetoImp: '02', impuesto: '003', tipoFactor: 'Cuota', tasaOCuota: 1.6451,
        });
    });
});

describe('D7a · agrupar traslados', () => {
    it('una venta mixta en la global: IVA 16, IVA 0 y exento por separado', () => {
        const t = agruparTraslados([
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.16, base: 100, importe: 16 },
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0, base: 25, importe: 0 },
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.16, base: 50, importe: 8 },
            { impuesto: '002', tipoFactor: 'Exento', tasaOCuota: null, base: 10, importe: null },
        ]);
        expect(t).toEqual([
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.16, base: 150, importe: 24 },
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0, base: 25, importe: 0 },
            { impuesto: '002', tipoFactor: 'Exento', tasaOCuota: null, base: 10, importe: null },
        ]);
        expect(totalTrasladado(t)).toBe(24);
        expect(objetoImpDelResumen(['01', '02'])).toBe('02');
        expect(objetoImpDelResumen(['01'])).toBe('01');
    });
});

describe('D7a · el desglose de un abono', () => {
    it('un abono de la mitad lleva la mitad de cada traslado', () => {
        expect(prorratearTraslados([
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.16, base: 1000, importe: 160 },
            { impuesto: '002', tipoFactor: 'Exento', tasaOCuota: null, base: 300, importe: null },
        ], 0.5)).toEqual([
            { impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: 0.16, base: 500, importe: 80 },
            { impuesto: '002', tipoFactor: 'Exento', tasaOCuota: null, base: 150, importe: null },
        ]);
    });
});
