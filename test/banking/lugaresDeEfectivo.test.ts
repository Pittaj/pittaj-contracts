import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createBankAccountSchema, semillaDeCajaFuerte, semillaDeEfectivoEnManosDe, uuidDeMd5 } from '../../src/banking/index.js';

const md5 = (s: string) => createHash('md5').update(s).digest('hex');
const T = '11111111-1111-4111-8111-111111111111';
const L = '22222222-2222-4222-8222-222222222222';

describe('lugares de efectivo (E1 de plan-efectivo)', () => {
    it('el id es md5(semilla) con forma de uuid, igual que md5(...)::uuid de Postgres', () => {
        // Valor fijo: el escritorio (IdDeLugarDeEfectivoTests) y la migración 0215 dan el mismo.
        expect(uuidDeMd5(md5(semillaDeCajaFuerte(T, L)))).toBe(uuidDeMd5(md5(`cash-safe:${T}:${L}`)));
        expect(uuidDeMd5('0123456789abcdef0123456789abcdef')).toBe('01234567-89ab-cdef-0123-456789abcdef');
    });

    it('la caja fuerte y la custodia de la misma cosa no chocan', () => {
        expect(semillaDeCajaFuerte(T, L)).not.toBe(semillaDeEfectivoEnManosDe(T, L));
    });

    const base = { name: 'Caja chica Centro', kind: 'CASH', openingDate: '2026-11-16' };
    it('una caja chica pide sucursal y fondo', () => {
        expect(createBankAccountSchema.safeParse({ ...base, cashRole: 'PETTY' }).success).toBe(false);
        expect(createBankAccountSchema.safeParse({ ...base, cashRole: 'PETTY', locationId: L, fixedFund: 3000, maxExpense: 500 }).success).toBe(true);
    });

    it('el tope no pasa del fondo', () => {
        expect(createBankAccountSchema.safeParse({ ...base, cashRole: 'PETTY', locationId: L, fixedFund: 3000, maxExpense: 5000 }).success).toBe(false);
    });

    it('la caja fuerte no se da de alta a mano', () => {
        expect(createBankAccountSchema.safeParse({ ...base, cashRole: 'SAFE', locationId: L }).success).toBe(false);
    });

    it('un banco no tiene rol de efectivo', () => {
        expect(createBankAccountSchema.safeParse({ ...base, kind: 'BANK', cashRole: 'PETTY', locationId: L, fixedFund: 1 }).success).toBe(false);
    });
});
