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

describe('instanteParaElMes', () => {
    const ahora = new Date('2026-12-01T16:00:00Z');
    const venta = new Date('2026-11-30T20:00:00Z');
    it('sin fecha de solicitud, ahora', async () => {
        const { instanteParaElMes } = await import('../../src/sales-cfdi/facturarDesdeLaCaja');
        expect(instanteParaElMes({ completedAt: venta }, ahora)).toEqual(ahora);
    });
    it('pedida sin conexión el 30 y timbrada el 1: cuenta el 30', async () => {
        const { instanteParaElMes } = await import('../../src/sales-cfdi/facturarDesdeLaCaja');
        const pedida = new Date('2026-11-30T21:00:00Z');
        expect(instanteParaElMes({ solicitadaEn: pedida.toISOString(), completedAt: venta }, ahora)).toEqual(pedida);
    });
    it('una fecha antes de la venta o en el futuro no cuenta', async () => {
        const { instanteParaElMes } = await import('../../src/sales-cfdi/facturarDesdeLaCaja');
        expect(instanteParaElMes({ solicitadaEn: '2026-10-01T00:00:00Z', completedAt: venta }, ahora)).toEqual(ahora);
        expect(instanteParaElMes({ solicitadaEn: '2027-01-01T00:00:00Z', completedAt: venta }, ahora)).toEqual(ahora);
    });
});
