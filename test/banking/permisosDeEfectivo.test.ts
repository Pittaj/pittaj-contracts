import { describe, expect, it } from 'vitest';
import { permisoDelMovimiento, permisoDelTraspaso } from '../../src/banking/lugares/permisosDeEfectivo';

describe('permisos del efectivo (tanda 2)', () => {
    it('cada tipo de traspaso pide el suyo', () => {
        expect(permisoDelTraspaso('COLLECTION')).toBe('cash.collect');
        expect(permisoDelTraspaso('DEPOSIT')).toBe('cash.deposit');
        expect(permisoDelTraspaso('REPLENISHMENT')).toBe('cash.petty');
        expect(permisoDelTraspaso('TRANSFER')).toBe('bank-transfer.create');
        expect(permisoDelTraspaso(undefined)).toBe('bank-transfer.create');
    });

    it('el retiro del dueño y el gasto de caja chica piden el suyo; lo demás, el de siempre', () => {
        const base = { accountKind: 'CASH', cashRole: 'SAFE', direction: 'OUT', categoryCode: 'PRESTAMO_A_SOCIO' };
        expect(permisoDelMovimiento(base)).toBe('cash.owner-draw');
        expect(permisoDelMovimiento({ ...base, categoryCode: 'REPARTO_UTILIDADES', cashRole: 'PETTY' })).toBe('cash.owner-draw');
        expect(permisoDelMovimiento({ ...base, categoryCode: 'GASTO', cashRole: 'PETTY' })).toBe('cash.petty');
        expect(permisoDelMovimiento({ ...base, categoryCode: 'GASTO', cashRole: 'PETTY', direction: 'IN' })).toBe('bank-transaction.create');
        expect(permisoDelMovimiento({ ...base, accountKind: 'BANK' })).toBe('bank-transaction.create');
    });
});
