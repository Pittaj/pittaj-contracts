/** B2 · Los contratos de los cobros de clientes desde el banco. */
import { describe, expect, it } from 'vitest';
import {
    BANKING_CONSTANTS,
    createCustomerPaymentFromDepositSchema,
    linkCustomerPaymentsSchema,
} from '../../src/banking/index.js';

const UUID = '6f1c1c1a-1111-4222-8333-444455556666';

describe('B2 · cobros desde el banco', () => {
    it('el tipo cabe en la columna del reparto (varchar 15)', () => {
        for (const t of BANKING_CONSTANTS.RECEIVABLE_DOCUMENT_TYPES) expect(t.length).toBeLessThanOrEqual(15);
    });

    it('vincular reemplaza la lista: vacía desvincula', () => {
        expect(linkCustomerPaymentsSchema.parse({ version: 3, payments: [] }).payments).toEqual([]);
        expect(() => linkCustomerPaymentsSchema.parse({ version: 3, payments: [{ customerPaymentId: UUID, appliedAmount: 0 }] })).toThrow();
    });

    it('crear el cobro pide cliente y al menos una venta', () => {
        expect(() => createCustomerPaymentFromDepositSchema.parse({ version: 1, customerId: UUID, applications: [] })).toThrow();
        const ok = createCustomerPaymentFromDepositSchema.parse({
            version: 1,
            customerId: UUID,
            applications: [{ documentId: UUID, amount: 116 }],
        });
        expect(ok.applications[0]!.amount).toBe(116);
    });
});
