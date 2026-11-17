import { describe, expect, it } from 'bun:test';
import { motivoParaNoFacturar } from '../../src/sales-cfdi/facturarDesdeLaCaja';

describe('motivoParaNoFacturar', () => {
    const hoy = new Date('2026-11-17T18:00:00Z');

    it('una venta de este mes, fuera de cualquier global, se factura', () => {
        expect(motivoParaNoFacturar({ completedAt: '2026-11-02T16:00:00Z', enGlobalTimbrada: false }, hoy)).toBeNull();
    });

    it('la que ya va en una global timbrada no', () => {
        expect(motivoParaNoFacturar({ completedAt: '2026-11-02T16:00:00Z', enGlobalTimbrada: true }, hoy)).toBe('en-global-timbrada');
    });

    it('la de un mes anterior no', () => {
        expect(motivoParaNoFacturar({ completedAt: '2026-10-30T16:00:00Z', enGlobalTimbrada: false }, hoy)).toBe('de-otro-mes');
    });

    it('el mes se cuenta en la hora de México: el 31 a las 19:00 todavía es octubre', () => {
        // 2026-11-01T01:00Z es el 31 de octubre a las 19:00 en CDMX.
        const venta = { completedAt: '2026-11-01T01:00:00Z', enGlobalTimbrada: false };
        expect(motivoParaNoFacturar(venta, new Date('2026-11-01T02:00:00Z'))).toBeNull();
        expect(motivoParaNoFacturar(venta, new Date('2026-11-02T18:00:00Z'))).toBe('de-otro-mes');
    });
});
