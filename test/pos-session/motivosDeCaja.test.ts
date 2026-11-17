import { describe, expect, it } from 'vitest';
import {
    CASH_MOVEMENT_REASON_LABELS,
    DOCUMENT_CASH_MOVEMENT_REASONS,
    MANUAL_CASH_MOVEMENT_REASONS,
    POS_SESSION_CONSTANTS,
    addCashMovementSchema,
    esMotivoManual,
    fondoQueQuedo,
    diferenciaDeFondo,
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

describe('E2 de plan-efectivo · el retiro dice a dónde va', () => {
    const CAJA_FUERTE = 'aaaaaaaa-0000-4000-8000-000000000001';
    const PERSONA = 'aaaaaaaa-0000-4000-8000-000000000002';
    const base = { version: 1, type: 'CASH_OUT', reason: 'WITHDRAWAL', amount: 8000 };

    it('sin destino no hay retiro', () => {
        expect(addCashMovementSchema.safeParse(base).success).toBe(false);
    });
    it('a la caja fuerte o a las manos de alguien, no a las dos', () => {
        expect(addCashMovementSchema.safeParse({ ...base, cashAccountId: CAJA_FUERTE }).success).toBe(true);
        expect(addCashMovementSchema.safeParse({ ...base, custodianUserId: PERSONA }).success).toBe(true);
        expect(addCashMovementSchema.safeParse({ ...base, cashAccountId: CAJA_FUERTE, custodianUserId: PERSONA }).success).toBe(false);
    });
    it('el cambio puede decir de dónde vino; un gasto no lleva cuenta de efectivo', () => {
        expect(addCashMovementSchema.safeParse({ version: 1, type: 'CASH_IN', reason: 'CHANGE_FUND', amount: 300, cashAccountId: CAJA_FUERTE }).success).toBe(true);
        expect(addCashMovementSchema.safeParse({ version: 1, type: 'CASH_OUT', reason: 'EXPENSE', amount: 30, cashAccountId: CAJA_FUERTE }).success).toBe(false);
    });
    it('el fondo que quedó y su aviso', () => {
        expect(fondoQueQuedo(13_365.5, 11_865.5)).toBe(1500);
        expect(diferenciaDeFondo(1500, 1500)).toBeNull();
        expect(diferenciaDeFondo(2000, 1500)).toBe(500);
        expect(diferenciaDeFondo(2000, null)).toBeNull();
    });
});
