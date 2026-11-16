import { describe, expect, it } from 'vitest';
import {
  asignarFifo,
  createTransferSchema,
  toleranciaDelDeposito,
  BANKING_SYSTEM_CATEGORIES,
} from '../../src/banking/index.js';

describe('E3 · movimientos de efectivo', () => {
  it('la tolerancia del depósito es el 1 %, entre 2 centavos y $500', () => {
    expect(toleranciaDelDeposito(40350)).toBe(403.5);
    expect(toleranciaDelDeposito(1)).toBe(0.02);
    expect(toleranciaDelDeposito(1_000_000)).toBe(500);
    expect(40350 - 40300).toBeLessThanOrEqual(toleranciaDelDeposito(40350));
  });

  it('FIFO: cada salida se cubre con las entradas más viejas', () => {
    const r = asignarFifo(
      [
        { id: 'centro', date: '2026-11-10', amount: 25000 },
        { id: 'norte', date: '2026-11-09', amount: 20000 },
      ],
      [
        { id: 'proveedor', date: '2026-11-10', amount: 3000 },
        { id: 'deposito', date: '2026-11-11', amount: 40350 },
      ],
    );
    expect(r.asignaciones).toEqual([
      { entradaId: 'norte', salidaId: 'proveedor', amount: 3000 },
      { entradaId: 'norte', salidaId: 'deposito', amount: 17000 },
      { entradaId: 'centro', salidaId: 'deposito', amount: 23350 },
    ]);
    expect(r.pendientes).toEqual([{ entradaId: 'centro', amount: 1650 }]);
    expect(r.sinCubrir).toBe(0);
  });

  it('FIFO: lo que sale de más queda sin cubrir', () => {
    const r = asignarFifo([{ id: 'a', date: '2026-11-01', amount: 100.1 }], [{ id: 's', date: '2026-11-02', amount: 150.35 }]);
    expect(r.sinCubrir).toBe(50.25);
    expect(r.pendientes).toEqual([]);
  });

  it('el traspaso dice qué clase es; sin decirlo es un traspaso', () => {
    const base = {
      fromAccountId: '11111111-1111-4111-8111-111111111111',
      toAccountId: '22222222-2222-4222-8222-222222222222',
      amount: 10,
      date: '2026-11-16',
    };
    expect(createTransferSchema.parse(base).kind).toBeUndefined();
    expect(createTransferSchema.parse({ ...base, kind: 'DEPOSIT' }).kind).toBe('DEPOSIT');
    expect(() => createTransferSchema.parse({ ...base, kind: 'OTRO' })).toThrow();
  });

  it('el faltante a cargo es una categoría de sistema en 113-01', () => {
    expect(BANKING_SYSTEM_CATEGORIES.find((c) => c.code === 'FALTANTE_A_CARGO')?.ledgerAccountCode).toBe('113-01');
  });
});
