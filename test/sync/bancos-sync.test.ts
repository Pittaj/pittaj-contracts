import { describe, expect, it } from 'vitest';
import {
  bankAccountSyncSchema,
  bankTransactionSyncSchema,
  bankTransferSyncSchema,
  transactionCategorySyncSchema,
} from '../../src/sync/index.js';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const cuenta = {
  id: uuid(1), name: 'BBVA Empresa', kind: 'BANK', currency: 'MXN',
  openingBalance: 1000, openingDate: '2026-10-01', status: 'ACTIVE', version: 1,
};
const movimiento = {
  id: uuid(2), accountId: uuid(1), date: '2026-10-26', direction: 'OUT', amount: 250.5,
  currency: 'MXN', categoryId: uuid(3), sourceType: 'MANUAL', userId: uuid(4), status: 'PENDING', version: 1,
};

describe('A1 · payloads del sync de Bancos', () => {
  it('una cuenta válida pasa', () => {
    expect(bankAccountSyncSchema.safeParse(cuenta).success).toBe(true);
  });

  it('ningún payload lleva saldo: si alguien lo manda, se descarta', () => {
    const r = bankAccountSyncSchema.parse({ ...cuenta, currentBalance: 99999 });
    expect(r).not.toHaveProperty('currentBalance');
  });

  it('el escritorio no sube la cuenta puente', () => {
    expect(bankAccountSyncSchema.safeParse({ ...cuenta, kind: 'TRANSIT' }).success).toBe(false);
  });

  it('un movimiento válido pasa y un monto ≤ 0 no', () => {
    expect(bankTransactionSyncSchema.safeParse(movimiento).success).toBe(true);
    expect(bankTransactionSyncSchema.safeParse({ ...movimiento, amount: 0 }).success).toBe(false);
    expect(bankTransactionSyncSchema.safeParse({ ...movimiento, amount: -5 }).success).toBe(false);
  });

  it('la fecha del movimiento es civil, no un instante', () => {
    expect(bankTransactionSyncSchema.safeParse({ ...movimiento, date: '2026-10-26T10:00:00Z' }).success).toBe(false);
  });

  it('un traspaso lleva monto positivo y cuentas', () => {
    const t = { id: uuid(5), fromAccountId: uuid(1), toAccountId: uuid(6), amount: 100, currency: 'MXN', date: '2026-10-26', version: 1 };
    expect(bankTransferSyncSchema.safeParse(t).success).toBe(true);
    expect(bankTransferSyncSchema.safeParse({ ...t, amount: 0 }).success).toBe(false);
  });

  it('una categoría del usuario no declara isSystem', () => {
    const c = transactionCategorySyncSchema.parse({ id: uuid(7), name: 'Fletes', flow: 'OUT', status: 'ACTIVE', version: 1, isSystem: true });
    expect(c).not.toHaveProperty('isSystem');
  });
});
