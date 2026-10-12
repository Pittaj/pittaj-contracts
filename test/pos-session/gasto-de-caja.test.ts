/**
 * @fileoverview El concepto del gasto de caja (F6.7): solo en una salida con motivo «Gasto».
 */

import { describe, it, expect } from 'vitest';
import { addCashMovementSchema } from '../../src/pos-session/schemas/posSessionSchemas';

const GARRAFON = 'aaaaaaaa-0000-4000-8000-000000000010';
const base = { version: 1, type: 'CASH_OUT', reason: 'EXPENSE', amount: 45 };

describe('El concepto del gasto de caja', () => {
    it('se acepta en un gasto, y también sin él (Otros gastos)', () => {
        expect(addCashMovementSchema.safeParse({ ...base, expenseConceptId: GARRAFON }).success).toBe(true);
        expect(addCashMovementSchema.safeParse({ ...base, expenseConceptId: null }).success).toBe(true);
        expect(addCashMovementSchema.safeParse(base).success).toBe(true);
    });

    it('no va en un retiro ni en una entrada', () => {
        const retiro = addCashMovementSchema.safeParse({ ...base, reason: 'WITHDRAWAL', expenseConceptId: GARRAFON });
        expect(retiro.success).toBe(false);
        const entrada = addCashMovementSchema.safeParse({ ...base, type: 'CASH_IN', expenseConceptId: GARRAFON });
        expect(entrada.success).toBe(false);
    });
});
