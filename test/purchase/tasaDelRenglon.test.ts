import { describe, expect, it } from 'vitest';
import { tasaDelRenglonDelCfdi } from '../../src/purchase/cfdiMatching';

describe('tasaDelRenglonDelCfdi', () => {
    it('sin el IVA del concepto, la tasa del comprobante', () => {
        expect(tasaDelRenglonDelCfdi({ importe: 100, descuento: 0, taxRate: 0.16 })).toBe(0.16);
    });

    it('si la tasa reproduce el IVA al centavo, se queda la tasa', () => {
        expect(tasaDelRenglonDelCfdi({ importe: 10.33, descuento: 0, taxRate: 0.16, taxAmount: 1.65 })).toBe(0.16);
    });

    it('gasolina: el IVA va sobre la base sin IEPS → tasa efectiva que da el IVA del CFDI', () => {
        // CFDI real de SERVICIO ONARI: importe 519.281505, IVA 80.718495 sobre base 504.490592.
        const tasa = tasaDelRenglonDelCfdi({ importe: 519.281505, descuento: 0, taxRate: 0.16, taxAmount: 80.718495 });
        expect(tasa).toBe(0.155443);
        expect(Math.round(519.281505 * tasa * 100) / 100).toBe(80.72);
    });
});
