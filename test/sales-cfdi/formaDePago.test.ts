import { describe, expect, it } from 'bun:test';
import { criterioDelEgreso, formaPagoDeLaNota, formaPagoDelEgreso } from '../../src/sales-cfdi/formaDePago';

describe('formaPagoDeLaNota', () => {
    it('por omisión es 17 (Compensación)', () => {
        expect(formaPagoDeLaNota(null)).toBe('17');
        expect(formaPagoDeLaNota('')).toBe('17');
    });
    it('respeta lo configurado si es una clave pagada', () => expect(formaPagoDeLaNota('01')).toBe('01'));
    it('lee el valor guardado como cadena JSON', () => expect(formaPagoDeLaNota('"01"')).toBe('01'));
    it('no acepta 99 ni basura', () => {
        expect(formaPagoDeLaNota('99')).toBe('17');
        expect(formaPagoDeLaNota('efectivo')).toBe('17');
    });
});

describe('criterioDelEgreso', () => {
    it('por omisión ORIGEN', () => expect(criterioDelEgreso(undefined)).toBe('ORIGEN'));
    it('lee REEMBOLSO sin importar mayúsculas', () => expect(criterioDelEgreso('reembolso')).toBe('REEMBOLSO'));
    it('un valor raro cae a ORIGEN', () => expect(criterioDelEgreso('X')).toBe('ORIGEN'));
    it('lee el valor guardado como cadena JSON', () => expect(criterioDelEgreso('"REEMBOLSO"')).toBe('REEMBOLSO'));
});

describe('formaPagoDelEgreso', () => {
    it('ORIGEN: la de la venta, aunque se haya devuelto distinto', () =>
        expect(formaPagoDelEgreso({ criterio: 'ORIGEN', formaDeLaVenta: '04', formaDelReembolso: '01' })).toBe('04'));
    it('REEMBOLSO: la del reembolso', () =>
        expect(formaPagoDelEgreso({ criterio: 'REEMBOLSO', formaDeLaVenta: '04', formaDelReembolso: '17' })).toBe('17'));
    it('REEMBOLSO sin saber cómo se devolvió: la de la venta', () =>
        expect(formaPagoDelEgreso({ criterio: 'REEMBOLSO', formaDeLaVenta: '03', formaDelReembolso: null })).toBe('03'));
    it('venta a crédito sin pagar: 15 (Condonación), nunca 99', () =>
        expect(formaPagoDelEgreso({ criterio: 'ORIGEN', formaDeLaVenta: '99', formaDelReembolso: '01' })).toBe('15'));
    it('sin datos: 15', () =>
        expect(formaPagoDelEgreso({ criterio: 'ORIGEN', formaDeLaVenta: null, formaDelReembolso: null })).toBe('15'));
});

describe('FORMAS_PARA_LA_NOTA_DE_CREDITO', () => {
    it('la primera es la de omisión y todas son claves pagadas', async () => {
        const { FORMAS_PARA_LA_NOTA_DE_CREDITO, esFormaDePagoPagada } = await import('../../src/sales-cfdi/formaDePago');
        expect(FORMAS_PARA_LA_NOTA_DE_CREDITO[0]!.clave).toBe(formaPagoDeLaNota(null));
        expect(FORMAS_PARA_LA_NOTA_DE_CREDITO.every((f) => esFormaDePagoPagada(f.clave))).toBe(true);
    });
});
