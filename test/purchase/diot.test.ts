import { describe, it, expect } from 'vitest';
import {
    basesDeIvaDelComprobante,
    basesDeIvaDeRenglones,
    claseDeIvaDelConcepto,
    compraDelComprobante,
    operacionDiotSugerida,
    prorratearBasesDeIva,
    moiPropuesto,
    pareceActivoFijo,
} from '../../src/purchase/index.js';

const c = (o: Record<string, unknown>) => ({ importe: 0, descuento: 0, taxRate: 0, ...o }) as never;

describe('D2 · clase de IVA del concepto', () => {
    it('separa 16, 8, tasa 0, exento y no objeto', () => {
        expect(claseDeIvaDelConcepto(c({ taxRate: 0.16, ivaFactor: 'Tasa', objetoImp: '02' }))).toBe('IVA16');
        expect(claseDeIvaDelConcepto(c({ taxRate: 0.08, ivaFactor: 'Tasa', objetoImp: '02' }))).toBe('IVA8');
        expect(claseDeIvaDelConcepto(c({ taxRate: 0, ivaFactor: 'Tasa', objetoImp: '02' }))).toBe('TASA0');
        expect(claseDeIvaDelConcepto(c({ ivaFactor: 'Exento', objetoImp: '02' }))).toBe('EXENTO');
        expect(claseDeIvaDelConcepto(c({ objetoImp: '01' }))).toBe('NO_OBJETO');
        // Una punta que lee el objeto pero el concepto no trae traslado de IVA: no objeto.
        expect(claseDeIvaDelConcepto(c({ objetoImp: '02', ivaFactor: null }))).toBe('NO_OBJETO');
        // Una punta vieja sin datos: por la tasa.
        expect(claseDeIvaDelConcepto(c({ taxRate: 0 }))).toBe('TASA0');
    });
});

describe('D2 · bases del comprobante', () => {
    it('gasolina: la base al 16 % es la del traslado (504.50), no el importe (519.28)', () => {
        const b = basesDeIvaDelComprobante([
            c({ importe: 519.28, taxRate: 0.16, taxAmount: 80.72, ivaBase: 504.5, ivaFactor: 'Tasa', objetoImp: '02' }),
        ]);
        expect(b).toEqual({ IVA16: { base: 504.5, iva: 80.72 } });
    });

    it('una factura mixta (abarrotes) reparte sus conceptos por columna', () => {
        const b = basesDeIvaDelComprobante([
            c({ importe: 100, taxRate: 0.16, taxAmount: 16, ivaBase: 100, ivaFactor: 'Tasa', objetoImp: '02' }),
            c({ importe: 50, taxRate: 0, taxAmount: 0, ivaBase: 50, ivaFactor: 'Tasa', objetoImp: '02' }),
            c({ importe: 30, ivaBase: 30, ivaFactor: 'Exento', objetoImp: '02' }),
            c({ importe: 20, objetoImp: '01' }),
        ]);
        expect(b).toEqual({
            IVA16: { base: 100, iva: 16 },
            TASA0: { base: 50, iva: 0 },
            EXENTO: { base: 30, iva: 0 },
            NO_OBJETO: { base: 20, iva: 0 },
        });
    });

    it('compraDelComprobante las trae en pesos', () => {
        const compra = compraDelComprobante(
            [c({ claveProdServ: '1', cantidad: 1, valorUnitario: 10, importe: 10, taxRate: 0.16, taxAmount: 1.6, ivaBase: 10, ivaFactor: 'Tasa', objetoImp: '02' })],
            { total: 11.6, trasladoIva: 1.6, retencionIsr: 0, retencionIva: 0, trasladoLocal: 0, retencionLocal: 0, moneda: 'USD', tipoCambio: 20 },
        );
        expect(compra.basesDeIva).toEqual({ IVA16: { base: 200, iva: 32 } });
    });

    it('sin comprobante, por la tasa de los renglones', () => {
        expect(basesDeIvaDeRenglones([
            { taxPercent: 0.16, taxBaseAmount: 100, taxAmount: 16 },
            { taxPercent: 16, taxBaseAmount: 10, taxAmount: 1.6 },
            { taxPercent: 0, taxBaseAmount: 40, taxAmount: 0 },
        ])).toEqual({ IVA16: { base: 110, iva: 17.6 }, TASA0: { base: 40, iva: 0 } });
    });

    it('lo pagado de una factura a crédito se prorratea', () => {
        expect(prorratearBasesDeIva({ IVA16: { base: 100, iva: 16 } }, 0.5)).toEqual({ IVA16: { base: 50, iva: 8 } });
    });
});

describe('D2 · tipo de operación sugerido', () => {
    it('bienes 02, renta 06, honorarios 03, el resto 85, global 87', () => {
        expect(operacionDiotSugerida({ kind: 'INVENTORY' })).toBe('02');
        expect(operacionDiotSugerida({ kind: 'FIXED_ASSET' })).toBe('02');
        expect(operacionDiotSugerida({ kind: 'EXPENSE', conceptoCode: 'RENT' })).toBe('06');
        expect(operacionDiotSugerida({ kind: 'EXPENSE', conceptoCode: 'FEES' })).toBe('03');
        expect(operacionDiotSugerida({ kind: 'EXPENSE', conceptoCode: 'ELECTRICITY' })).toBe('85');
        expect(operacionDiotSugerida({ kind: 'EXPENSE' })).toBe('85');
        expect(operacionDiotSugerida({ kind: 'EXPENSE', proveedorGlobal: true })).toBe('87');
    });
});

describe('D6 · activo desde la compra', () => {
    it('MOI = base sin IVA + impuestos locales', () => {
        expect(moiPropuesto({ subtotalAmount: 20000, discountAmount: 500, trasladoLocal: 0 })).toBe(19500);
    });
    it('un gasto que parece equipo y pasa del umbral pregunta', () => {
        expect(pareceActivoFijo({ descripcion: 'REFRIGERADOR VERTICAL 2 PUERTAS', base: 18000 })).toBe('refrigerador');
        expect(pareceActivoFijo({ descripcion: 'Computadora portátil', base: 12000 })).toBe('computadora');
        expect(pareceActivoFijo({ descripcion: 'Refrigerador de juguete', base: 300 })).toBeNull();
        expect(pareceActivoFijo({ descripcion: 'Servicio de limpieza', base: 9000 })).toBeNull();
    });
});
