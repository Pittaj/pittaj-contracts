import { describe, expect, it } from 'vitest';
import { desgloseDeLaLiquidacion, registerPspSettlementSchema } from '../../src/banking/index.js';

describe('F3.4 · liquidación de pasarela', () => {
  it('el caso $9,712: parte la deducción en comisión e IVA y cierra al centavo', () => {
    const d = desgloseDeLaLiquidacion(10000, 9712);
    expect(d).toEqual({ grossAmount: 10000, commissionAmount: 248.28, commissionTaxAmount: 39.72, netAmount: 9712 });
  });

  it('un cobro de Mercado Pago: 499 cobrado, 474.66 abonado', () => {
    const d = desgloseDeLaLiquidacion(499, 474.66);
    expect(Math.round((d.grossAmount - d.commissionAmount - d.commissionTaxAmount) * 100)).toBe(47466);
    expect(d.commissionAmount).toBe(20.98);
    expect(d.commissionTaxAmount).toBe(3.36);
  });

  it('sin deducción no hay comisión', () => {
    expect(desgloseDeLaLiquidacion(100, 100)).toMatchObject({ commissionAmount: 0, commissionTaxAmount: 0 });
  });

  it('la comisión no puede comerse lo cobrado', () => {
    const base = { id: crypto.randomUUID(), accountId: crypto.randomUUID(), date: '2026-10-24' };
    expect(registerPspSettlementSchema.safeParse({ ...base, grossAmount: 10, commissionAmount: 8, commissionTaxAmount: 2 }).success).toBe(false);
    expect(registerPspSettlementSchema.safeParse({ ...base, grossAmount: 10, commissionAmount: 0.5, commissionTaxAmount: 0.08 }).success).toBe(true);
  });
});
