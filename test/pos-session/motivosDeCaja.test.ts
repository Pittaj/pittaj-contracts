import { describe, expect, it } from 'vitest';
import {
    CASH_MOVEMENT_REASON_LABELS,
    DOCUMENT_CASH_MOVEMENT_REASONS,
    MANUAL_CASH_MOVEMENT_REASONS,
    POS_SESSION_CONSTANTS,
    addCashMovementSchema,
    esMotivoManual,
} from '../../src/pos-session/index.js';

describe('motivos del cajón (E0 de plan-efectivo)', () => {
    it('cada motivo tiene etiqueta', () => {
        for (const m of POS_SESSION_CONSTANTS.CASH_MOVEMENT_REASONS) {
            expect(CASH_MOVEMENT_REASON_LABELS[m]).toBeTruthy();
        }
    });

    it('lo que nace de un documento no se captura a mano', () => {
        for (const m of DOCUMENT_CASH_MOVEMENT_REASONS) {
            expect(esMotivoManual('CASH_IN', m)).toBe(false);
            expect(esMotivoManual('CASH_OUT', m)).toBe(false);
        }
    });

    it('DEPOSIT ya no se ofrece: es Cambio o Abono de apartado', () => {
        expect(esMotivoManual('CASH_IN', 'DEPOSIT')).toBe(false);
        expect(MANUAL_CASH_MOVEMENT_REASONS.CASH_IN).toContain('CHANGE_FUND');
    });

    it('el retiro del dueño es una salida, no una entrada', () => {
        expect(esMotivoManual('CASH_OUT', 'OWNER_DRAW')).toBe(true);
        expect(esMotivoManual('CASH_IN', 'OWNER_DRAW')).toBe(false);
    });

    it('el alta manual rechaza un motivo de documento', () => {
        const base = { version: 1, type: 'CASH_OUT', amount: 500 };
        expect(addCashMovementSchema.safeParse({ ...base, reason: 'OWNER_DRAW' }).success).toBe(true);
        expect(addCashMovementSchema.safeParse({ ...base, reason: 'SUPPLIER_PAYMENT' }).success).toBe(false);
        expect(addCashMovementSchema.safeParse({ ...base, type: 'CASH_IN', reason: 'DEPOSIT' }).success).toBe(false);
    });
});
