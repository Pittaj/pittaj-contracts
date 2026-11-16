import { describe, expect, it } from 'vitest';
import {
  CASH_SETTINGS_DEFAULT,
  aClavesDeEfectivo,
  cajaChicaBaja,
  deClavesDeEfectivo,
  diasEntre,
  excedeElTope,
  propuestaDeReposicion,
  registerCashCountSchema,
  resultadoDelArqueo,
  sumaDeDenominaciones,
} from '../../src/banking/index.js';

describe('E4 · ajustes de efectivo', () => {
  it('por omisión: 50, 7 días, 30 %, 5 días', () => {
    expect(CASH_SETTINGS_DEFAULT).toEqual({
      count: { explainAbove: 50 },
      custody: { agingDays: 7 },
      petty: { lowBalancePercent: 30 },
      deposit: { matchDays: 5 },
    });
  });

  it('ida y vuelta por claves; lo inválido toma su valor por omisión', () => {
    const claves = aClavesDeEfectivo({ ...CASH_SETTINGS_DEFAULT, count: { explainAbove: 100 } });
    expect(claves['cash.count.explainAbove']).toBe('100');
    expect(deClavesDeEfectivo(claves).count.explainAbove).toBe(100);
    expect(deClavesDeEfectivo({ 'cash.custody.agingDays': '"siete"', 'cash.petty.lowBalancePercent': '150' })).toEqual(CASH_SETTINGS_DEFAULT);
  });
});

describe('E4 · arqueo', () => {
  it('un faltante de $100 con umbral de $50 pide explicación', () => {
    expect(resultadoDelArqueo(1000, 900, 50)).toEqual({ diferencia: -100, faltaExplicacion: true });
    expect(resultadoDelArqueo(1000, 900, 50, 'Un billete falso')).toEqual({ diferencia: -100, faltaExplicacion: false });
    expect(resultadoDelArqueo(1000, 1000.3, 50)).toEqual({ diferencia: 0.3, faltaExplicacion: false });
  });

  it('suma las denominaciones sin errores de flotante', () => {
    expect(sumaDeDenominaciones([{ value: 500, quantity: 3 }, { value: 0.1, quantity: 3 }, { value: 0.5, quantity: 1 }])).toBe(1500.8);
  });

  it('el esperado no viaja: solo lo contado', () => {
    expect(registerCashCountSchema.parse({ countedAmount: 900, date: '2026-11-16' }).countedAmount).toBe(900);
    expect(() => registerCashCountSchema.parse({ countedAmount: -1, date: '2026-11-16' })).toThrow();
  });
});

describe('E4 · caja chica', () => {
  it('reponer es lo que le falta a su fondo', () => {
    expect(propuestaDeReposicion(2000, 1350.5)).toBe(649.5);
    expect(propuestaDeReposicion(2000, 2100)).toBe(0);
    expect(propuestaDeReposicion(null, 10)).toBe(0);
  });

  it('se marca baja por debajo del porcentaje del fondo', () => {
    expect(cajaChicaBaja(2000, 599.99, 30)).toBe(true);
    expect(cajaChicaBaja(2000, 600, 30)).toBe(false);
    expect(cajaChicaBaja(null, 0, 30)).toBe(false);
  });

  it('un gasto mayor que el tope se rechaza; sin tope, nunca', () => {
    expect(excedeElTope(500, 500.01)).toBe(true);
    expect(excedeElTope(500, 500)).toBe(false);
    expect(excedeElTope(null, 1e6)).toBe(false);
  });

  it('días entre fechas', () => {
    expect(diasEntre('2026-11-09', '2026-11-16')).toBe(7);
  });
});
